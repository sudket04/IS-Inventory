using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/network-zones")]
public sealed class NetworkZonesController : LookupsControllerBase<NetworkZone, NetworkZonesController.Dto>
{
    public sealed record Dto(
        string Code, string Name, string? Description, byte TrustLevel,
        string ColorToken, bool IsInternetFacing, int SortOrder);

    public NetworkZonesController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<NetworkZone> Set => Db.NetworkZones;
    protected override int GetId(NetworkZone entity) => entity.ZoneId;
    protected override void SetActiveFlag(NetworkZone entity, bool value) => entity.IsActive = value;

    protected override void Apply(NetworkZone entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description;
        entity.TrustLevel = dto.TrustLevel;
        entity.ColorToken = dto.ColorToken;
        entity.IsInternetFacing = dto.IsInternetFacing;
        entity.SortOrder = dto.SortOrder;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("VLANs", (db, id, ct) => db.Vlans.CountAsync(v => v.ZoneId == id, ct)),
    };
}
