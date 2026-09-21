using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/web-categories")]
public sealed class WebCategoriesController : LookupsControllerBase<WebCategory, WebCategoriesController.Dto>
{
    public sealed record Dto(string Code, string NameTh, string NameEn, byte RiskLevel, int SortOrder);

    public WebCategoriesController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<WebCategory> Set => Db.WebCategories;
    protected override int GetId(WebCategory entity) => entity.CategoryId;
    protected override void SetActiveFlag(WebCategory entity, bool value) => entity.IsActive = value;

    protected override void Apply(WebCategory entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.NameTh = dto.NameTh.Trim();
        entity.NameEn = dto.NameEn.Trim();
        entity.RiskLevel = dto.RiskLevel;
        entity.SortOrder = dto.SortOrder;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Internet Policy Categories", (db, id, ct) => db.InternetPolicyCategories.CountAsync(c => c.CategoryId == id, ct)),
    };
}
