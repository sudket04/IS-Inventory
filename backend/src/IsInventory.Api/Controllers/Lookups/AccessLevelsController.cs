using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/access-levels")]
public sealed class AccessLevelsController : LookupsControllerBase<AccessLevel, AccessLevelsController.Dto>
{
    public sealed record Dto(string Code, string NameTh, string NameEn, bool CanWrite, byte PrivilegeRank, string ColorToken);

    public AccessLevelsController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<AccessLevel> Set => Db.AccessLevels;
    protected override int GetId(AccessLevel entity) => entity.AccessLevelId;
    protected override void SetActiveFlag(AccessLevel entity, bool value) => entity.IsActive = value;

    protected override void Apply(AccessLevel entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.NameTh = dto.NameTh.Trim();
        entity.NameEn = dto.NameEn.Trim();
        entity.CanWrite = dto.CanWrite;
        entity.PrivilegeRank = dto.PrivilegeRank;
        entity.ColorToken = dto.ColorToken;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("File Share Permissions", (db, id, ct) => db.FileSharePermissions.CountAsync(p => p.AccessLevelId == id, ct)),
    };
}
