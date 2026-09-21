using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Clusters;

/// <summary>
/// v1.2 module (docs/database/06-module-v1.2.sql §3): VM/Storage/DB clusters and their
/// member assets. Like dbo.server_applications, this table has no is_deleted column, so
/// Delete is a genuine hard delete — blocked with a friendly 409 (instead of a raw SQL
/// error) when members or shared volumes still reference the cluster, since there is no
/// ON DELETE CASCADE anywhere in this schema (decision #10).
/// </summary>
[ApiController]
[Authorize]
[RequiresPermission("clusters", PermissionAction.View)]
public sealed class ClustersController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public ClustersController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/clusters")]
    public async Task<ActionResult<IReadOnlyList<ClusterListItem>>> List(CancellationToken ct)
    {
        var items = await _db.VwClusterOverviews
            .OrderBy(v => v.ClusterName)
            .Select(v => new ClusterListItem(
                v.ClusterId, v.ClusterCode, v.ClusterName, v.ClusterType, v.VendorProduct,
                v.ManagementIp, v.ExpectedNodeCount, v.ActiveMembers, v.IsDegraded, v.MemberList,
                v.SharedVolumeCount, v.SharedCapacityGb, v.SharedUsedGb, v.SharedUsedPercent,
                v.SiteName, v.IsActive))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("api/clusters/{id:int}")]
    public async Task<ActionResult<ClusterDetail>> Get(int id, CancellationToken ct)
    {
        var detail = await GetDetail(id, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost("api/clusters")]
    [RequiresPermission("clusters", PermissionAction.Create)]
    public async Task<ActionResult<ClusterDetail>> Create([FromBody] ClusterRequest request, CancellationToken ct)
    {
        var entity = new Cluster();
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.Clusters.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Cluster code \"{request.Code}\" is already in use." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Cluster type or quorum type is not a recognized value." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.CreatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "cluster",
            EntityId = entity.ClusterId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await GetDetail(entity.ClusterId, ct));
    }

    [HttpPut("api/clusters/{id:int}")]
    [RequiresPermission("clusters", PermissionAction.Edit)]
    public async Task<ActionResult<ClusterDetail>> Update(int id, [FromBody] ClusterRequest request, CancellationToken ct)
    {
        var entity = await _db.Clusters.FirstOrDefaultAsync(c => c.ClusterId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        Apply(entity, request);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedBy = CurrentUserId();

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Cluster code \"{request.Code}\" is already in use." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Cluster type or quorum type is not a recognized value." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.UpdatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "cluster",
            EntityId = entity.ClusterId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await GetDetail(entity.ClusterId, ct));
    }

    [HttpDelete("api/clusters/{id:int}")]
    [RequiresPermission("clusters", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Clusters.FirstOrDefaultAsync(c => c.ClusterId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.Clusters.Remove(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return Conflict(new { message = "This cluster still has members or storage volumes attached. Remove those first." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "cluster",
            EntityId = entity.ClusterId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // --- Members ---

    [HttpGet("api/clusters/{clusterId:int}/members")]
    public async Task<ActionResult<IReadOnlyList<ClusterMemberItem>>> ListMembers(int clusterId, CancellationToken ct)
    {
        var items = await _db.ClusterMembers
            .Where(m => m.ClusterId == clusterId)
            .OrderByDescending(m => m.IsActive).ThenBy(m => m.NodePriority)
            .Select(m => new ClusterMemberItem(
                m.MemberId, m.ClusterId, m.AssetId, m.Asset.AssetTag, m.Asset.Name,
                m.MemberRole, m.NodePriority, m.JoinedDate, m.LeftDate, m.IsActive, m.Notes))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost("api/clusters/{clusterId:int}/members")]
    [RequiresPermission("clusters", PermissionAction.Create)]
    public async Task<ActionResult<ClusterMemberItem>> AddMember(int clusterId, [FromBody] ClusterMemberRequest request, CancellationToken ct)
    {
        var cluster = await _db.Clusters.FirstOrDefaultAsync(c => c.ClusterId == clusterId, ct);
        if (cluster is null)
        {
            return NotFound(new { message = "Cluster not found." });
        }

        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.AssetId == request.AssetId && !a.IsDeleted, ct);
        if (asset is null)
        {
            return BadRequest(new { message = $"Asset #{request.AssetId} not found." });
        }

        var entity = new ClusterMember
        {
            ClusterId = clusterId,
            AssetId = request.AssetId,
            MemberRole = request.MemberRole,
            NodePriority = request.NodePriority,
            JoinedDate = request.JoinedDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedBy = CurrentUserId(),
        };
        _db.ClusterMembers.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"{asset.AssetTag} is already an active \"{request.MemberRole}\" member of this cluster." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Member role is not a recognized value." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.CreatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "cluster_member",
            EntityId = entity.MemberId,
            EntityLabel = $"{cluster.Name} / {asset.AssetTag}",
        });
        await _db.SaveChangesAsync(ct);

        return Ok(new ClusterMemberItem(entity.MemberId, entity.ClusterId, entity.AssetId, asset.AssetTag, asset.Name,
            entity.MemberRole, entity.NodePriority, entity.JoinedDate, entity.LeftDate, entity.IsActive, entity.Notes));
    }

    [HttpPut("api/cluster-members/{id:int}")]
    [RequiresPermission("clusters", PermissionAction.Edit)]
    public async Task<IActionResult> UpdateMember(int id, [FromBody] ClusterMemberUpdateRequest request, CancellationToken ct)
    {
        var entity = await _db.ClusterMembers.FirstOrDefaultAsync(m => m.MemberId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        entity.MemberRole = request.MemberRole;
        entity.NodePriority = request.NodePriority;
        entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    /// <summary>Marks the member as having left (left_date = today) rather than deleting the
    /// row, so cluster membership history is preserved — is_active is a computed column
    /// derived from left_date in the schema itself.</summary>
    [HttpPost("api/cluster-members/{id:int}/leave")]
    [RequiresPermission("clusters", PermissionAction.Edit)]
    public async Task<IActionResult> LeaveMember(int id, CancellationToken ct)
    {
        var entity = await _db.ClusterMembers.FirstOrDefaultAsync(m => m.MemberId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        entity.LeftDate = DateOnly.FromDateTime(DateTime.UtcNow);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "cluster_member",
            EntityId = entity.MemberId,
            EntityLabel = "left cluster",
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("api/cluster-members/{id:int}")]
    [RequiresPermission("clusters", PermissionAction.Delete)]
    public async Task<IActionResult> RemoveMember(int id, CancellationToken ct)
    {
        var entity = await _db.ClusterMembers.FirstOrDefaultAsync(m => m.MemberId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.ClusterMembers.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<ClusterDetail?> GetDetail(int id, CancellationToken ct) =>
        await _db.Clusters
            .Where(c => c.ClusterId == id)
            .Select(c => new ClusterDetail(
                c.ClusterId, c.Code, c.Name, c.ClusterType, c.VendorProduct,
                c.ExpectedNodeCount, c.QuorumType, c.ManagementIp, c.ManagementUrl,
                c.SiteLocationId, c.SiteLocation != null ? c.SiteLocation.Name : null,
                c.Description, c.IsActive, c.CreatedAt, c.UpdatedAt))
            .FirstOrDefaultAsync(ct);

    private static void Apply(Cluster e, ClusterRequest d)
    {
        e.Code = d.Code.Trim();
        e.Name = d.Name.Trim();
        e.ClusterType = d.ClusterType;
        e.VendorProduct = string.IsNullOrWhiteSpace(d.VendorProduct) ? null : d.VendorProduct.Trim();
        e.ExpectedNodeCount = d.ExpectedNodeCount;
        e.QuorumType = d.QuorumType;
        e.ManagementIp = string.IsNullOrWhiteSpace(d.ManagementIp) ? null : d.ManagementIp.Trim();
        e.ManagementUrl = string.IsNullOrWhiteSpace(d.ManagementUrl) ? null : d.ManagementUrl.Trim();
        e.SiteLocationId = d.SiteLocationId;
        e.Description = string.IsNullOrWhiteSpace(d.Description) ? null : d.Description.Trim();
        e.IsActive = d.IsActive;
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627);

    // SQL Server uses the same error number for a FK violation (blocked delete) and a CHECK
    // constraint violation (invalid enum value) — both read as "statement conflicted with
    // constraint X"; callers pick the right message for their own context.
    private static bool IsCheckViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;
}
