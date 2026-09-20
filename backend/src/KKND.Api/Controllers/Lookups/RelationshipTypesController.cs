using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Lookups;

[Route("api/lookups/relationship-types")]
public sealed class RelationshipTypesController : LookupsControllerBase<RelationshipType, RelationshipTypesController.Dto>
{
    public sealed record Dto(string Code, string ForwardName, string InverseName);

    public RelationshipTypesController(KkndDbContext db) : base(db) { }

    protected override DbSet<RelationshipType> Set => Db.RelationshipTypes;
    protected override int GetId(RelationshipType entity) => entity.RelationshipTypeId;
    protected override void SetActiveFlag(RelationshipType entity, bool value) => entity.IsActive = value;

    protected override void Apply(RelationshipType entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.ForwardName = dto.ForwardName.Trim();
        entity.InverseName = dto.InverseName.Trim();
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Asset Relationships", (db, id, ct) => db.AssetRelationships.CountAsync(r => r.RelationshipTypeId == id, ct)),
    };
}
