using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Software;

/// <summary>
/// FR-SW-03..05: which target assets a Software License (SFT) asset is installed on, used
/// to count seats against contract_assets.seat_count (dbo.vw_software_seat_usage). "Remove"
/// sets removed_date rather than deleting the row (removed_date IS NULL is what the unique
/// index UX_swinst_active and the seat-usage view both key off — same pattern as Cluster
/// member leave/rejoin), so uninstall history survives.
/// </summary>
[ApiController]
[Authorize]
[RequiresPermission("software", PermissionAction.View)]
public sealed class SoftwareInstallationsController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public SoftwareInstallationsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/assets/{softwareAssetId:int}/installations")]
    public async Task<ActionResult<IReadOnlyList<SoftwareInstallationItem>>> List(int softwareAssetId, CancellationToken ct)
    {
        var items = await _db.SoftwareInstallations
            .Where(i => i.SoftwareAssetId == softwareAssetId)
            .OrderByDescending(i => i.RemovedDate == null).ThenByDescending(i => i.InstalledDate)
            .Select(i => new SoftwareInstallationItem(
                i.InstallationId, i.TargetAssetId, i.TargetAsset.AssetTag, i.TargetAsset.Name,
                i.InstalledDate, i.InstalledVersion, i.RemovedDate, i.IsActive, i.Notes))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("api/assets/{softwareAssetId:int}/seat-usage")]
    public async Task<ActionResult<SeatUsageItem>> SeatUsage(int softwareAssetId, CancellationToken ct)
    {
        var usage = await _db.VwSoftwareSeatUsages
            .Where(v => v.AssetId == softwareAssetId)
            .Select(v => new SeatUsageItem(
                v.AssetId, v.AssetTag, v.SoftwareName, v.Publisher, v.Version, v.LicenseType,
                v.SeatsPurchased, v.SeatsUsed, v.SeatsAvailable, v.IsOverDeployed, v.OverDeployedCount,
                v.LicenseEndDate, v.DaysUntilExpiry, v.CurrentContractNo, v.VendorName))
            .FirstOrDefaultAsync(ct);

        return usage is null ? NotFound() : Ok(usage);
    }

    [HttpGet("api/software-licenses/seat-usage")]
    public async Task<ActionResult<IReadOnlyList<SeatUsageItem>>> AllSeatUsage(CancellationToken ct) =>
        Ok(await _db.VwSoftwareSeatUsages
            .OrderByDescending(v => v.IsOverDeployed).ThenBy(v => v.SoftwareName)
            .Select(v => new SeatUsageItem(
                v.AssetId, v.AssetTag, v.SoftwareName, v.Publisher, v.Version, v.LicenseType,
                v.SeatsPurchased, v.SeatsUsed, v.SeatsAvailable, v.IsOverDeployed, v.OverDeployedCount,
                v.LicenseEndDate, v.DaysUntilExpiry, v.CurrentContractNo, v.VendorName))
            .ToListAsync(ct));

    [HttpPost("api/assets/{softwareAssetId:int}/installations")]
    [RequiresPermission("software", PermissionAction.Create)]
    public async Task<ActionResult<SoftwareInstallationItem>> Install(
        int softwareAssetId, [FromBody] SoftwareInstallationRequest request, CancellationToken ct)
    {
        var softwareAsset = await _db.Assets.Include(a => a.Category)
            .FirstOrDefaultAsync(a => a.AssetId == softwareAssetId && !a.IsDeleted, ct);
        if (softwareAsset is null) return NotFound(new { message = "Software License asset not found." });
        if (softwareAsset.Category.Code != "SFT")
            return BadRequest(new { message = "Only Software License assets can have installations." });

        var targetExists = await _db.Assets.AnyAsync(a => a.AssetId == request.TargetAssetId && !a.IsDeleted, ct);
        if (!targetExists) return BadRequest(new { message = "Target asset does not exist." });

        var entity = new SoftwareInstallation
        {
            SoftwareAssetId = softwareAssetId,
            TargetAssetId = request.TargetAssetId,
            InstalledDate = request.InstalledDate,
            InstalledVersion = request.InstalledVersion,
            Notes = request.Notes,
            CreatedBy = CurrentUserId(),
        };
        _db.SoftwareInstallations.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This software is already actively installed on that asset." });
        }
        catch (DbUpdateException ex) when (IsCheckOrFkViolation(ex))
        {
            return BadRequest(new { message = "A software asset cannot be installed on itself, and removed date cannot be before the install date." });
        }

        await LogAsync("CREATE", entity.InstallationId, $"{softwareAsset.AssetTag} → asset #{request.TargetAssetId}", ct);

        var target = await _db.Assets.FirstAsync(a => a.AssetId == entity.TargetAssetId, ct);
        return Ok(new SoftwareInstallationItem(
            entity.InstallationId, entity.TargetAssetId, target.AssetTag, target.Name,
            entity.InstalledDate, entity.InstalledVersion, entity.RemovedDate, entity.IsActive, entity.Notes));
    }

    [HttpDelete("api/software-installations/{id:int}")]
    [RequiresPermission("software", PermissionAction.Delete)]
    public async Task<IActionResult> Uninstall(int id, CancellationToken ct)
    {
        var entity = await _db.SoftwareInstallations.FirstOrDefaultAsync(i => i.InstallationId == id, ct);
        if (entity is null) return NotFound();
        if (entity.RemovedDate is not null) return NoContent(); // already uninstalled — idempotent

        entity.RemovedDate = DateOnly.FromDateTime(DateTime.UtcNow);
        entity.RemovedBy = CurrentUserId();
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", entity.InstallationId, $"installation #{entity.InstallationId}", ct);
        return NoContent();
    }

    private async Task LogAsync(string action, int entityId, string label, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "software_installation",
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

    private static bool IsCheckOrFkViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;
}
