using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/manufacturers")]
public sealed class ManufacturersController : LookupsControllerBase<Manufacturer, ManufacturersController.Dto>
{
    public sealed record Dto(string Name, string? SupportUrl);

    public ManufacturersController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<Manufacturer> Set => Db.Manufacturers;
    protected override int GetId(Manufacturer entity) => entity.ManufacturerId;
    protected override void SetActiveFlag(Manufacturer entity, bool value) => entity.IsActive = value;

    protected override void Apply(Manufacturer entity, Dto dto)
    {
        entity.Name = dto.Name.Trim();
        entity.SupportUrl = dto.SupportUrl;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Assets", (db, id, ct) => db.Assets.CountAsync(a => a.ManufacturerId == id && !a.IsDeleted, ct)),
        new("Device Models", (db, id, ct) => db.DeviceModels.CountAsync(m => m.ManufacturerId == id, ct)),
    };
}
