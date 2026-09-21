using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/folder-classification-levels")]
public sealed class FolderClassificationLevelsController
    : LookupsControllerBase<FolderClassificationLevel, FolderClassificationLevelsController.Dto>
{
    public sealed record Dto(
        string Code, string NameTh, string NameEn, byte SensitivityRank,
        string ColorToken, bool RequiresViewAudit, string? Description);

    public FolderClassificationLevelsController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<FolderClassificationLevel> Set => Db.FolderClassificationLevels;
    protected override int GetId(FolderClassificationLevel entity) => entity.ClassificationId;
    protected override void SetActiveFlag(FolderClassificationLevel entity, bool value) => entity.IsActive = value;

    protected override void Apply(FolderClassificationLevel entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.NameTh = dto.NameTh.Trim();
        entity.NameEn = dto.NameEn.Trim();
        entity.SensitivityRank = dto.SensitivityRank;
        entity.ColorToken = dto.ColorToken;
        entity.RequiresViewAudit = dto.RequiresViewAudit;
        entity.Description = dto.Description;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Role Visibility Rules", (db, id, ct) => db.ClassificationRoleVisibilities.CountAsync(v => v.ClassificationId == id, ct)),
        new("File Shares", (db, id, ct) => db.FileShares.CountAsync(f => f.ClassificationId == id && !f.IsDeleted, ct)),
    };
}
