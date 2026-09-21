using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/asset-categories")]
public sealed class AssetCategoriesController : LookupsControllerBase<AssetCategory, AssetCategoriesController.Dto>
{
    // detail_table ไม่อยู่ในฟอร์ม — เป็นค่าระดับ Schema ที่ผูกกับ Class Table Inheritance
    // (HANDOFF.md การตัดสินใจ #1) แก้ผ่านหน้าตั้งค่าไม่ปลอดภัย ต้องแก้ผ่าน Migration เท่านั้น
    public sealed record Dto(string Code, string Name, string? IconName, int SortOrder);

    public AssetCategoriesController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<AssetCategory> Set => Db.AssetCategories;
    protected override int GetId(AssetCategory entity) => entity.CategoryId;
    protected override void SetActiveFlag(AssetCategory entity, bool value) => entity.IsActive = value;

    protected override void Apply(AssetCategory entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.Name = dto.Name.Trim();
        entity.IconName = dto.IconName;
        entity.SortOrder = dto.SortOrder;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Assets", (db, id, ct) => db.Assets.CountAsync(a => a.CategoryId == id && !a.IsDeleted, ct)),
        new("Asset Types", (db, id, ct) => db.AssetTypes.CountAsync(t => t.CategoryId == id, ct)),
    };
}
