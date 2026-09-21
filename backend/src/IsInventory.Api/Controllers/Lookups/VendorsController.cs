using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/vendors")]
public sealed class VendorsController : LookupsControllerBase<Vendor, VendorsController.Dto>
{
    public sealed record Dto(
        string Code, string Name, string? ContactPerson, string? Phone, string? Email, string? Address, string? TaxId);

    public VendorsController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<Vendor> Set => Db.Vendors;
    protected override int GetId(Vendor entity) => entity.VendorId;
    protected override void SetActiveFlag(Vendor entity, bool value) => entity.IsActive = value;

    protected override void Apply(Vendor entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.Name = dto.Name.Trim();
        entity.ContactPerson = dto.ContactPerson;
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
        entity.Address = dto.Address;
        entity.TaxId = dto.TaxId;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Assets", (db, id, ct) => db.Assets.CountAsync(a => a.VendorId == id && !a.IsDeleted, ct)),
        new("Contracts", (db, id, ct) => db.Contracts.CountAsync(c => c.VendorId == id, ct)),
    };
}
