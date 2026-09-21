using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using FileShare = IsInventory.Infrastructure.Entities.FileShare;

namespace IsInventory.Api.Controllers.PermissionControl;

/// <summary>
/// v1.5 module (docs/database/14-module-v1.5-permission-control.sql): manually-entered
/// registry of File Server folders + the AD groups granted access to them (Sprint 8's
/// Collector Agent will later sync ad_groups/ad_users for real — until then ad_group_id
/// stays null and ad_group_name_raw is free text, per the proposal's explicit design).
///
/// Visibility is enforced here, not with SQL Server Row-Level Security (ruled out earlier
/// in the project) — dbo.classification_role_visibility says which of the 4 roles may
/// view/edit/export which of the 7 classification levels, and a share whose classification
/// the caller can't see is left out entirely (proposal §9: "ปกปิดในรายการรวม" — not shown
/// even by name). Opening a share whose classification requires_view_audit = 1 logs a
/// VIEW_SENSITIVE audit entry (the one read-path audit_logs records, since every other
/// event in this system is a write).
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class FileSharesController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public FileSharesController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/file-shares")]
    public async Task<ActionResult<IReadOnlyList<FileShareListItem>>> List([FromQuery] string? search, CancellationToken ct)
    {
        var visible = await VisibleClassificationIdsAsync(ct);
        var query = _db.VwFileShareLists.Where(s => visible.Contains(s.ClassificationId));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            query = query.Where(s => EF.Functions.Like(s.ShareName, $"%{needle}%") || EF.Functions.Like(s.FolderPath, $"%{needle}%"));
        }

        var items = await query
            .OrderBy(s => s.ShareName)
            .Select(s => new FileShareListItem(
                s.ShareId, s.ShareName, s.FolderPath, s.AssetTag, s.ServerName,
                s.ClassificationCode, s.ClassificationName, s.SensitivityRank, s.ClassificationColor,
                s.OwnerDepartment, s.OwnerUserName, s.TotalGroupCount, s.OrphanGroupCount,
                s.LastReviewedAt, s.DaysSinceReview))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("api/file-shares/{id:int}")]
    public async Task<ActionResult<FileShareDetail>> Get(int id, CancellationToken ct)
    {
        var share = await _db.FileShares
            .Include(s => s.Asset)
            .Include(s => s.Classification)
            .Include(s => s.OwnerDepartment)
            .Include(s => s.OwnerUser)
            .FirstOrDefaultAsync(s => s.ShareId == id && !s.IsDeleted, ct);

        if (share is null) return NotFound();

        var visible = await VisibleClassificationIdsAsync(ct);
        if (!visible.Contains(share.ClassificationId)) return NotFound();

        if (share.Classification.RequiresViewAudit)
        {
            await LogAsync("VIEW_SENSITIVE", share.ShareId, $"{share.ShareName} ({share.FolderPath})", ct);
        }

        var canEdit = await CanEditClassificationAsync(share.ClassificationId, ct);

        return Ok(new FileShareDetail(
            share.ShareId, share.AssetId, share.Asset.AssetTag, share.Asset.Name, share.ShareName, share.FolderPath,
            share.ClassificationId, share.Classification.Code, share.Classification.NameEn, share.Classification.SensitivityRank, share.Classification.ColorToken,
            share.OwnerDepartmentId, share.OwnerDepartment.Name, share.OwnerUserId, share.OwnerUser?.FullName,
            share.BusinessPurpose, share.FsrmQuotaTemplate, share.IsQuotaManaged,
            share.LastReviewedAt, share.LastReviewedBy, share.ReviewNote, share.Notes, canEdit));
    }

    [HttpPost("api/file-shares")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<FileShareDetail>> Create([FromBody] FileShareRequest request, CancellationToken ct)
    {
        if (!await CanEditClassificationAsync(request.ClassificationId, ct))
        {
            return Forbid();
        }

        await EnsureFileServerRoleAsync(request.AssetId, ct);

        var share = new FileShare
        {
            AssetId = request.AssetId,
            ShareName = request.ShareName,
            FolderPath = request.FolderPath,
            ClassificationId = request.ClassificationId,
            OwnerDepartmentId = request.OwnerDepartmentId,
            OwnerUserId = request.OwnerUserId,
            BusinessPurpose = request.BusinessPurpose,
            FsrmQuotaTemplate = request.FsrmQuotaTemplate,
            IsQuotaManaged = request.IsQuotaManaged,
            LastReviewedAt = request.LastReviewedAt,
            LastReviewedBy = request.LastReviewedAt.HasValue ? CurrentUserId() : null,
            ReviewNote = request.ReviewNote,
            Notes = request.Notes,
            CreatedBy = CurrentUserId(),
        };

        _db.FileShares.Add(share);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This folder path is already registered on this server." });
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("CREATE", share.ShareId, $"{share.ShareName} ({share.FolderPath})", ct);
        return await Get(share.ShareId, ct);
    }

    [HttpPut("api/file-shares/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<FileShareDetail>> Update(int id, [FromBody] FileShareRequest request, CancellationToken ct)
    {
        var share = await _db.FileShares.FirstOrDefaultAsync(s => s.ShareId == id && !s.IsDeleted, ct);
        if (share is null) return NotFound();

        if (!await CanEditClassificationAsync(share.ClassificationId, ct) || !await CanEditClassificationAsync(request.ClassificationId, ct))
        {
            return Forbid();
        }

        if (share.AssetId != request.AssetId)
        {
            await EnsureFileServerRoleAsync(request.AssetId, ct);
        }

        share.AssetId = request.AssetId;
        share.ShareName = request.ShareName;
        share.FolderPath = request.FolderPath;
        share.ClassificationId = request.ClassificationId;
        share.OwnerDepartmentId = request.OwnerDepartmentId;
        share.OwnerUserId = request.OwnerUserId;
        share.BusinessPurpose = request.BusinessPurpose;
        share.FsrmQuotaTemplate = request.FsrmQuotaTemplate;
        share.IsQuotaManaged = request.IsQuotaManaged;
        if (request.LastReviewedAt.HasValue && request.LastReviewedAt != share.LastReviewedAt)
        {
            share.LastReviewedBy = CurrentUserId();
        }
        share.LastReviewedAt = request.LastReviewedAt;
        share.ReviewNote = request.ReviewNote;
        share.Notes = request.Notes;
        share.UpdatedBy = CurrentUserId();
        share.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This folder path is already registered on this server." });
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("UPDATE", share.ShareId, $"{share.ShareName} ({share.FolderPath})", ct);
        return await Get(share.ShareId, ct);
    }

    [HttpDelete("api/file-shares/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var share = await _db.FileShares.FirstOrDefaultAsync(s => s.ShareId == id && !s.IsDeleted, ct);
        if (share is null) return NotFound();

        if (!await CanEditClassificationAsync(share.ClassificationId, ct)) return Forbid();

        share.IsDeleted = true;
        share.UpdatedBy = CurrentUserId();
        share.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", share.ShareId, $"{share.ShareName} ({share.FolderPath})", ct);
        return NoContent();
    }

    // --- Permissions sub-resource ---

    [HttpGet("api/file-shares/{shareId:int}/permissions")]
    public async Task<ActionResult<IReadOnlyList<FileSharePermissionItem>>> Permissions(int shareId, CancellationToken ct)
    {
        if (!await ShareVisibleAsync(shareId, ct)) return NotFound();

        var items = await _db.FileSharePermissions
            .Where(p => p.ShareId == shareId && !p.IsDeleted)
            .OrderBy(p => p.AdGroupNameRaw)
            .Select(p => new
            {
                p.PermissionId, p.AdGroupId, p.AdGroupNameRaw,
                p.AccessLevel.Code, p.AccessLevel.NameEn, p.AccessLevel.ColorToken,
                p.GrantedReason, p.RequestReference,
                IsOrphan = p.AdGroupId != null && !p.AdGroup!.IsPresentInAd,
            })
            .ToListAsync(ct);

        return Ok(items.Select(p => new FileSharePermissionItem(
            p.PermissionId, p.AdGroupId, p.AdGroupNameRaw, p.Code, p.NameEn, p.ColorToken,
            p.GrantedReason, p.RequestReference, p.IsOrphan)));
    }

    [HttpPost("api/file-shares/{shareId:int}/permissions")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<FileSharePermissionItem>> AddPermission(int shareId, [FromBody] FileSharePermissionRequest request, CancellationToken ct)
    {
        var share = await _db.FileShares.FirstOrDefaultAsync(s => s.ShareId == shareId && !s.IsDeleted, ct);
        if (share is null) return NotFound();
        if (!await CanEditClassificationAsync(share.ClassificationId, ct)) return Forbid();

        var permission = new FileSharePermission
        {
            ShareId = shareId,
            AdGroupId = request.AdGroupId,
            AdGroupNameRaw = request.AdGroupNameRaw,
            AccessLevelId = request.AccessLevelId,
            GrantedReason = request.GrantedReason,
            RequestReference = request.RequestReference,
            CreatedBy = CurrentUserId(),
        };

        _db.FileSharePermissions.Add(permission);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This AD group already has a permission entry on this folder." });
        }

        await LogAsync("CREATE", share.ShareId, $"Grant {request.AdGroupNameRaw} on {share.ShareName}", ct);

        var accessLevel = await _db.AccessLevels.FirstAsync(a => a.AccessLevelId == request.AccessLevelId, ct);
        return Ok(new FileSharePermissionItem(permission.PermissionId, permission.AdGroupId, permission.AdGroupNameRaw, accessLevel.Code, accessLevel.NameEn, accessLevel.ColorToken, permission.GrantedReason, permission.RequestReference, false));
    }

    [HttpDelete("api/file-shares/{shareId:int}/permissions/{permissionId:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> RemovePermission(int shareId, int permissionId, CancellationToken ct)
    {
        var permission = await _db.FileSharePermissions
            .Include(p => p.Share)
            .FirstOrDefaultAsync(p => p.PermissionId == permissionId && p.ShareId == shareId && !p.IsDeleted, ct);
        if (permission is null) return NotFound();
        if (!await CanEditClassificationAsync(permission.Share.ClassificationId, ct)) return Forbid();

        permission.IsDeleted = true;
        permission.UpdatedBy = CurrentUserId();
        permission.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", shareId, $"Revoke {permission.AdGroupNameRaw} on share #{shareId}", ct);
        return NoContent();
    }

    // --- History — last 3 versions per folder, per Sprint Plan ("ประวัติสิทธิ์ 3 version") ---

    [HttpGet("api/file-shares/{shareId:int}/history")]
    public async Task<ActionResult<IReadOnlyList<PermissionVersionItem>>> History(int shareId, [FromQuery] bool all, CancellationToken ct)
    {
        if (!await ShareVisibleAsync(shareId, ct)) return NotFound();

        var ordered = _db.VwSharePermissionTimelines.Where(t => t.ShareId == shareId).OrderByDescending(t => t.ChangedAtUtc);
        var rows = all ? await ordered.ToListAsync(ct) : await ordered.Take(3).ToListAsync(ct);
        return Ok(rows.Select(r => new PermissionVersionItem(
            r.ChangeSeq, r.AdGroupName, r.AccessLevelName, r.PreviousAccessLevelName,
            r.ChangeAction, r.ChangeActionTh, r.ChangedByName, r.ChangedAtUtc, 0)));
    }

    // --- Helpers ---

    /// <summary>Auto-declares the FILE server role on save rather than requiring a separate
    /// "Server Roles" screen (none exists yet) — trg_file_shares_validate (THROW 51050)
    /// requires it, and a folder physically hosted there means the server IS acting as a
    /// file server, so recording that role here is the correct place, not extra scope.</summary>
    private async Task EnsureFileServerRoleAsync(int assetId, CancellationToken ct)
    {
        var fileRoleId = await _db.ServerRoles.Where(r => r.Code == "FILE").Select(r => r.ServerRoleId).FirstAsync(ct);
        var exists = await _db.ServerRoleAssignments.AnyAsync(a => a.AssetId == assetId && a.ServerRoleId == fileRoleId, ct);
        if (!exists)
        {
            // Saved immediately, not deferred into the caller's batch — trg_file_shares_validate
            // fires AFTER INSERT on file_shares and checks this table via a JOIN, and EF Core
            // gives no ordering guarantee between unrelated entities in the same SaveChanges call.
            _db.ServerRoleAssignments.Add(new ServerRoleAssignment { AssetId = assetId, ServerRoleId = fileRoleId, CreatedBy = CurrentUserId() });
            await _db.SaveChangesAsync(ct);
        }
    }

    private async Task<HashSet<int>> VisibleClassificationIdsAsync(CancellationToken ct)
    {
        var roleCode = User.FindFirstValue(ClaimTypes.Role);
        var ids = await _db.ClassificationRoleVisibilities
            .Where(v => v.Role.Code == roleCode && v.CanView)
            .Select(v => v.ClassificationId)
            .ToListAsync(ct);
        return ids.ToHashSet();
    }

    private async Task<bool> CanEditClassificationAsync(int classificationId, CancellationToken ct)
    {
        var roleCode = User.FindFirstValue(ClaimTypes.Role);
        return await _db.ClassificationRoleVisibilities
            .AnyAsync(v => v.Role.Code == roleCode && v.ClassificationId == classificationId && v.CanEdit, ct);
    }

    private async Task<bool> ShareVisibleAsync(int shareId, CancellationToken ct)
    {
        var classificationId = await _db.FileShares.Where(s => s.ShareId == shareId && !s.IsDeleted).Select(s => s.ClassificationId).FirstOrDefaultAsync(ct);
        if (classificationId == 0) return false;
        var visible = await VisibleClassificationIdsAsync(ct);
        return visible.Contains(classificationId);
    }

    private async Task LogAsync(string action, int entityId, string label, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "file_share",
            EntityId = entityId,
            EntityLabel = label,
        });
        await _db.SaveChangesAsync(ct);
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627);

    private static bool TryGetFriendlyMessage(DbUpdateException ex, out string message)
    {
        if (ex.InnerException is not SqlException sqlEx)
        {
            message = string.Empty;
            return false;
        }

        if (sqlEx.Number == 51050)
        {
            message = sqlEx.Message;
            return true;
        }

        if (sqlEx.Number != 547)
        {
            message = string.Empty;
            return false;
        }

        var text = sqlEx.Message;
        message = text switch
        {
            _ when text.Contains("CK_fs_path") => @"Folder path must be a full UNC path starting with \\ (e.g. \\FS01\Finance\Budget).",
            _ when text.Contains("CK_fs_review") => "A review date requires selecting who reviewed it.",
            _ => "This folder registration violates a data rule.",
        };
        return true;
    }
}
