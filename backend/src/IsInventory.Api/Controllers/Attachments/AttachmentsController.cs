using System.Security.Claims;
using System.Security.Cryptography;
using System.IO.Compression;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Attachments;

/// <summary>
/// FR-AT-01..05: file attachments on an asset. Files are stored outside the web root
/// (there is no wwwroot / UseStaticFiles in this API at all — see Program.cs) under a
/// configurable root, named on disk by a random GUID rather than the original file name
/// (schema comment: "กัน Path Traversal"), and only ever served back out through the
/// authenticated download endpoint below — never a direct file path.
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class AttachmentsController : ControllerBase
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // matches CK_attachments_size

    private static readonly Dictionary<string, string> AllowedExtensionToMime = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    private readonly IsInventoryDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;

    public AttachmentsController(IsInventoryDbContext db, IWebHostEnvironment env, IConfiguration config)
    {
        _db = db;
        _env = env;
        _config = config;
    }

    [HttpGet("api/assets/{assetId:int}/attachments")]
    public async Task<ActionResult<IReadOnlyList<AttachmentListItem>>> List(int assetId, CancellationToken ct) =>
        Ok(await ListInternal(a => a.AssetId == assetId, ct));

    [HttpGet("api/contracts/{contractId:int}/attachments")]
    public async Task<ActionResult<IReadOnlyList<AttachmentListItem>>> ListForContract(int contractId, CancellationToken ct) =>
        Ok(await ListInternal(a => a.ContractId == contractId, ct));

    [HttpPost("api/assets/{assetId:int}/attachments")]
    [Authorize(Policy = "ItStaffOrAbove")]
    [RequestSizeLimit(MaxFileSizeBytes + 1024)]
    public async Task<ActionResult<AttachmentListItem>> Upload(int assetId, [FromForm] IFormFile file, [FromForm] string? description, CancellationToken ct)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.AssetId == assetId && !a.IsDeleted, ct);
        if (asset is null)
        {
            return NotFound(new { message = "Asset not found." });
        }

        return await UploadInternal(assetId: assetId, contractId: null, $"asset-{assetId}", file, description, ct);
    }

    [HttpPost("api/contracts/{contractId:int}/attachments")]
    [Authorize(Policy = "ItStaffOrAbove")]
    [RequestSizeLimit(MaxFileSizeBytes + 1024)]
    public async Task<ActionResult<AttachmentListItem>> UploadForContract(int contractId, [FromForm] IFormFile file, [FromForm] string? description, CancellationToken ct)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.ContractId == contractId, ct);
        if (contract is null)
        {
            return NotFound(new { message = "Contract not found." });
        }

        return await UploadInternal(assetId: null, contractId: contractId, $"contract-{contractId}", file, description, ct);
    }

    private async Task<List<AttachmentListItem>> ListInternal(
        System.Linq.Expressions.Expression<Func<Attachment, bool>> ownerFilter, CancellationToken ct) =>
        await _db.Attachments
            .Where(a => !a.IsDeleted)
            .Where(ownerFilter)
            .OrderByDescending(a => a.UploadedAt)
            .Select(a => new AttachmentListItem(
                a.AttachmentId, a.OriginalFileName, a.MimeType, a.FileSizeBytes,
                a.Description, a.UploadedAt, a.UploadedByNavigation != null ? a.UploadedByNavigation.FullName : null))
            .ToListAsync(ct);

    private async Task<ActionResult<AttachmentListItem>> UploadInternal(
        int? assetId, int? contractId, string storageDir, IFormFile file, string? description, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest(new { message = "File exceeds the 10 MB limit." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensionToMime.TryGetValue(extension, out var expectedMime))
        {
            return BadRequest(new { message = "File type not allowed. Accepted: PDF, JPG, PNG, XLSX, DOCX." });
        }

        await using var stream = file.OpenReadStream();
        var buffer = new byte[file.Length];
        var read = 0;
        while (read < buffer.Length)
        {
            var n = await stream.ReadAsync(buffer.AsMemory(read), ct);
            if (n == 0) break;
            read += n;
        }

        // FR-AT-03: verify the actual file content matches the claimed type — never trust
        // the extension or the browser-supplied Content-Type alone.
        if (!MatchesSignature(buffer, extension))
        {
            return BadRequest(new { message = "File content does not match its extension. The upload was rejected." });
        }

        var hash = Convert.ToHexString(SHA256.HashData(buffer)).ToLowerInvariant();
        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var storageRoot = ResolveStorageRoot();
        var ownerDir = Path.Combine(storageRoot, storageDir);
        Directory.CreateDirectory(ownerDir);
        var fullPath = Path.Combine(ownerDir, storedFileName);
        await System.IO.File.WriteAllBytesAsync(fullPath, buffer, ct);

        var userId = CurrentUserId();
        var attachment = new Attachment
        {
            AssetId = assetId,
            ContractId = contractId,
            OriginalFileName = file.FileName,
            StoredFileName = storedFileName,
            StoragePath = Path.Combine(storageDir, storedFileName),
            MimeType = expectedMime,
            FileSizeBytes = (int)file.Length,
            FileHash = hash,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            UploadedAt = DateTimeOffset.UtcNow,
            UploadedBy = userId,
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "attachment",
            EntityId = attachment.AttachmentId,
            EntityLabel = attachment.OriginalFileName,
        });
        await _db.SaveChangesAsync(ct);

        var uploaderName = await _db.Users.Where(u => u.UserId == userId).Select(u => u.FullName).FirstOrDefaultAsync(ct);

        var item = new AttachmentListItem(
            attachment.AttachmentId, attachment.OriginalFileName, attachment.MimeType, attachment.FileSizeBytes,
            attachment.Description, attachment.UploadedAt, uploaderName);

        return assetId.HasValue
            ? CreatedAtAction(nameof(List), new { assetId }, item)
            : CreatedAtAction(nameof(ListForContract), new { contractId }, item);
    }

    [HttpGet("api/attachments/{id:int}/download")]
    public async Task<IActionResult> Download(int id, CancellationToken ct)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == id && !a.IsDeleted, ct);
        if (attachment is null)
        {
            return NotFound();
        }

        var fullPath = Path.Combine(ResolveStorageRoot(), attachment.StoragePath);
        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { message = "The file is missing from storage." });
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(fullPath, ct);
        return File(bytes, attachment.MimeType, attachment.OriginalFileName);
    }

    [HttpDelete("api/attachments/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == id && !a.IsDeleted, ct);
        if (attachment is null)
        {
            return NotFound();
        }

        attachment.IsDeleted = true;
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "attachment",
            EntityId = attachment.AttachmentId,
            EntityLabel = attachment.OriginalFileName,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private string ResolveStorageRoot()
    {
        var configured = _config["Attachments:StorageRoot"] ?? "App_Data/attachments";
        return Path.IsPathRooted(configured) ? configured : Path.Combine(_env.ContentRootPath, configured);
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool MatchesSignature(byte[] content, string extension)
    {
        switch (extension.ToLowerInvariant())
        {
            case ".pdf":
                return StartsWith(content, "25504446"); // %PDF
            case ".jpg":
            case ".jpeg":
                return StartsWith(content, "FFD8FF");
            case ".png":
                return StartsWith(content, "89504E470D0A1A0A");
            case ".xlsx":
                return StartsWith(content, "504B0304") && ZipContainsEntry(content, "xl/workbook.xml");
            case ".docx":
                return StartsWith(content, "504B0304") && ZipContainsEntry(content, "word/document.xml");
            default:
                return false;
        }
    }

    private static bool StartsWith(byte[] content, string hexSignature)
    {
        var signature = Convert.FromHexString(hexSignature);
        if (content.Length < signature.Length) return false;
        return content.AsSpan(0, signature.Length).SequenceEqual(signature);
    }

    private static bool ZipContainsEntry(byte[] content, string entryName)
    {
        try
        {
            using var stream = new MemoryStream(content);
            using var zip = new ZipArchive(stream, ZipArchiveMode.Read);
            return zip.GetEntry(entryName) is not null;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }
}
