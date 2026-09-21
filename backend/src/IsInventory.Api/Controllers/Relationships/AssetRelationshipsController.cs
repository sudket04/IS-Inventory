using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Relationships;

/// <summary>
/// FR-CM-02: CMDB-style asset-to-asset relationships (dbo.asset_relationships +
/// dbo.relationship_types, e.g. "Hosted On" / "Hosts"). List reads from
/// dbo.vw_asset_relationships_expanded, which already unions both directions so a
/// relationship shows up on both the source and target asset's page with the correct
/// forward/inverse name.
/// </summary>
[ApiController]
[Authorize]
[RequiresPermission("assets", PermissionAction.View)]
public sealed class AssetRelationshipsController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public AssetRelationshipsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/assets/{assetId:int}/relationships")]
    public async Task<ActionResult<IReadOnlyList<AssetRelationshipItem>>> List(int assetId, CancellationToken ct)
    {
        var items = await _db.VwAssetRelationshipsExpandeds
            .Where(r => r.FromAssetId == assetId)
            .OrderBy(r => r.RelationshipName).ThenBy(r => r.RelatedAssetTag)
            .Select(r => new AssetRelationshipItem(
                r.RelationshipId, r.FromAssetId, r.ToAssetId, r.Direction, r.RelationshipName,
                r.RelatedAssetTag, r.RelatedAssetName, r.RelatedStatusCode, r.Notes))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost("api/assets/{assetId:int}/relationships")]
    [RequiresPermission("assets", PermissionAction.Create)]
    public async Task<ActionResult<AssetRelationshipItem>> Create(
        int assetId, [FromBody] AssetRelationshipRequest request, CancellationToken ct)
    {
        var sourceExists = await _db.Assets.AnyAsync(a => a.AssetId == assetId && !a.IsDeleted, ct);
        if (!sourceExists) return NotFound(new { message = "Asset not found." });

        if (assetId == request.TargetAssetId)
        {
            return BadRequest(new { message = "An asset cannot have a relationship with itself." });
        }

        var targetExists = await _db.Assets.AnyAsync(a => a.AssetId == request.TargetAssetId && !a.IsDeleted, ct);
        if (!targetExists) return BadRequest(new { message = "Related asset does not exist." });

        var entity = new AssetRelationship
        {
            SourceAssetId = assetId,
            TargetAssetId = request.TargetAssetId,
            RelationshipTypeId = request.RelationshipTypeId,
            Notes = request.Notes,
            CreatedBy = CurrentUserId(),
        };
        _db.AssetRelationships.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This relationship already exists between these two assets." });
        }
        catch (DbUpdateException ex) when (IsCheckOrFkViolation(ex))
        {
            return BadRequest(new { message = "Invalid relationship — check the related asset and relationship type." });
        }

        await LogAsync("CREATE", entity.RelationshipId, $"asset #{assetId} → asset #{request.TargetAssetId}", ct);

        var created = await _db.VwAssetRelationshipsExpandeds
            .Where(r => r.RelationshipId == entity.RelationshipId && r.FromAssetId == assetId)
            .Select(r => new AssetRelationshipItem(
                r.RelationshipId, r.FromAssetId, r.ToAssetId, r.Direction, r.RelationshipName,
                r.RelatedAssetTag, r.RelatedAssetName, r.RelatedStatusCode, r.Notes))
            .FirstAsync(ct);

        return Ok(created);
    }

    [HttpDelete("api/assets/{assetId:int}/relationships/{relationshipId:int}")]
    [RequiresPermission("assets", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int assetId, int relationshipId, CancellationToken ct)
    {
        var entity = await _db.AssetRelationships.FirstOrDefaultAsync(
            r => r.RelationshipId == relationshipId && (r.SourceAssetId == assetId || r.TargetAssetId == assetId), ct);
        if (entity is null) return NotFound();

        _db.AssetRelationships.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", relationshipId, $"relationship #{relationshipId}", ct);
        return NoContent();
    }

    private async Task LogAsync(string action, int entityId, string label, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "asset_relationship",
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
