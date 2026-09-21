using System.Security.Claims;
using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Clusters;

/// <summary>
/// v1.2 module (docs/database/06-module-v1.2.sql §4): storage volumes — replaced the old
/// free-text server_details.storage_config column (dropped in the same migration) so
/// capacity is tracked as real numbers instead of prose. A volume must belong to an asset
/// or a cluster (CK_vol_owner) and a shared volume must belong to a cluster
/// (CK_vol_shared_cluster) — this controller exposes that as two separate routes rather
/// than one generic endpoint, so each route can only create the shape the schema allows:
/// asset-owned (never shared) or cluster-owned (always shared).
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class StorageVolumesController : ControllerBase
{
    private readonly KkndDbContext _db;

    public StorageVolumesController(KkndDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/assets/{assetId:int}/storage-volumes")]
    public async Task<ActionResult<IReadOnlyList<StorageVolumeListItem>>> ListForAsset(int assetId, CancellationToken ct) =>
        Ok(await Query(v => v.AssetId == assetId).ToListAsync(ct));

    [HttpPost("api/assets/{assetId:int}/storage-volumes")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<StorageVolumeListItem>> CreateForAsset(int assetId, [FromBody] StorageVolumeRequest request, CancellationToken ct)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.AssetId == assetId && !a.IsDeleted, ct);
        if (asset is null)
        {
            return NotFound(new { message = "Asset not found." });
        }

        return await Create(request, assetId: assetId, clusterId: null, isShared: false, ct);
    }

    [HttpGet("api/clusters/{clusterId:int}/storage-volumes")]
    public async Task<ActionResult<IReadOnlyList<StorageVolumeListItem>>> ListForCluster(int clusterId, CancellationToken ct) =>
        Ok(await Query(v => v.ClusterId == clusterId).ToListAsync(ct));

    [HttpPost("api/clusters/{clusterId:int}/storage-volumes")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<StorageVolumeListItem>> CreateForCluster(int clusterId, [FromBody] StorageVolumeRequest request, CancellationToken ct)
    {
        var cluster = await _db.Clusters.FirstOrDefaultAsync(c => c.ClusterId == clusterId, ct);
        if (cluster is null)
        {
            return NotFound(new { message = "Cluster not found." });
        }

        return await Create(request, assetId: null, clusterId: clusterId, isShared: true, ct);
    }

    [HttpPut("api/storage-volumes/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<StorageVolumeListItem>> Update(int id, [FromBody] StorageVolumeRequest request, CancellationToken ct)
    {
        var entity = await _db.StorageVolumes.FirstOrDefaultAsync(v => v.VolumeId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        if (request.ProviderAssetId.HasValue &&
            !await _db.Assets.AnyAsync(a => a.AssetId == request.ProviderAssetId && !a.IsDeleted, ct))
        {
            return BadRequest(new { message = $"Provider asset #{request.ProviderAssetId} not found." });
        }

        Apply(entity, request);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedBy = CurrentUserId();

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Used capacity cannot exceed total capacity, and immutability days must be positive if set." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.UpdatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "storage_volume",
            EntityId = entity.VolumeId,
            EntityLabel = entity.VolumeName,
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await Query(v => v.VolumeId == id).FirstAsync(ct));
    }

    [HttpDelete("api/storage-volumes/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.StorageVolumes.FirstOrDefaultAsync(v => v.VolumeId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.StorageVolumes.Remove(entity);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "storage_volume",
            EntityId = entity.VolumeId,
            EntityLabel = entity.VolumeName,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private async Task<ActionResult<StorageVolumeListItem>> Create(
        StorageVolumeRequest request, int? assetId, int? clusterId, bool isShared, CancellationToken ct)
    {
        if (request.ProviderAssetId.HasValue &&
            !await _db.Assets.AnyAsync(a => a.AssetId == request.ProviderAssetId && !a.IsDeleted, ct))
        {
            return BadRequest(new { message = $"Provider asset #{request.ProviderAssetId} not found." });
        }

        var entity = new StorageVolume { AssetId = assetId, ClusterId = clusterId, IsShared = isShared };
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.StorageVolumes.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Used capacity cannot exceed total capacity, and immutability days must be positive if set." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.CreatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "storage_volume",
            EntityId = entity.VolumeId,
            EntityLabel = entity.VolumeName,
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await Query(v => v.VolumeId == entity.VolumeId).FirstAsync(ct));
    }

    private IQueryable<StorageVolumeListItem> Query(System.Linq.Expressions.Expression<Func<StorageVolume, bool>> predicate) =>
        _db.StorageVolumes
            .Where(predicate)
            .OrderBy(v => v.VolumeName)
            .Select(v => new StorageVolumeListItem(
                v.VolumeId, v.AssetId, v.ClusterId, v.ProviderAssetId,
                v.ProviderAsset != null ? v.ProviderAsset.AssetTag : null,
                v.VolumeName, v.VolumeType, v.StorageProtocol, v.RaidLevel, v.DiskType,
                v.CapacityGb, v.UsedGb, v.FreeGb, v.UsedPercent, v.LastMeasuredAt,
                v.MountPath, v.IsShared, v.IsThinProvisioned, v.EncryptionEnabled,
                v.ImmutabilityDays, v.RetentionDays, v.DedupRatio, v.Notes, v.IsActive));

    private static void Apply(StorageVolume e, StorageVolumeRequest d)
    {
        e.VolumeName = d.VolumeName.Trim();
        e.VolumeType = d.VolumeType;
        e.StorageProtocol = d.StorageProtocol;
        e.RaidLevel = string.IsNullOrWhiteSpace(d.RaidLevel) ? null : d.RaidLevel.Trim();
        e.DiskType = d.DiskType;
        e.CapacityGb = d.CapacityGb;
        e.UsedGb = d.UsedGb;
        e.LastMeasuredAt = d.LastMeasuredAt;
        e.MountPath = string.IsNullOrWhiteSpace(d.MountPath) ? null : d.MountPath.Trim();
        e.ProviderAssetId = d.ProviderAssetId;
        e.IsThinProvisioned = d.IsThinProvisioned;
        e.EncryptionEnabled = d.EncryptionEnabled;
        e.ImmutabilityDays = d.ImmutabilityDays;
        e.RetentionDays = d.RetentionDays;
        e.DedupRatio = d.DedupRatio;
        e.Notes = string.IsNullOrWhiteSpace(d.Notes) ? null : d.Notes.Trim();
        e.IsActive = d.IsActive;
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool IsCheckViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;
}
