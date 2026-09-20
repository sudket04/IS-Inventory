using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Lookups;

[Route("api/lookups/asset-statuses")]
public sealed class AssetStatusesController : LookupsControllerBase<AssetStatus, AssetStatusesController.Dto>
{
    public sealed record Dto(string Code, string Name, string ColorToken, bool IsOperational, int SortOrder);

    public AssetStatusesController(KkndDbContext db) : base(db) { }

    protected override DbSet<AssetStatus> Set => Db.AssetStatuses;
    protected override int GetId(AssetStatus entity) => entity.StatusId;
    protected override void SetActiveFlag(AssetStatus entity, bool value) => entity.IsActive = value;

    protected override void Apply(AssetStatus entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.Name = dto.Name.Trim();
        entity.ColorToken = dto.ColorToken;
        entity.IsOperational = dto.IsOperational;
        entity.SortOrder = dto.SortOrder;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Assets", (db, id, ct) => db.Assets.CountAsync(a => a.StatusId == id && !a.IsDeleted, ct)),
    };
}
