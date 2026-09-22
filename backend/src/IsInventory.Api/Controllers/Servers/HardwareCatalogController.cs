using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Servers;

/// <summary>
/// CPU core count / RAM (GB) / Storage size (GB, TB) — catalogs of values that are actually
/// sold, so a Server/Cluster/Storage form can only pick a real size instead of a free-typed
/// number (e.g. "5 GB RAM"). Same "+ Add" quick-add pattern as OsCatalogController: any User
/// who can edit Server/Storage data extends the catalog permanently from the form itself,
/// rather than through a separate Admin &gt; Master Data page.
/// </summary>
[ApiController]
[Authorize]
[RequiresPermission("server_inventory", PermissionAction.View)]
public sealed class HardwareCatalogController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public HardwareCatalogController(IsInventoryDbContext db)
    {
        _db = db;
    }

    public sealed record IntOption(int Id, int Value);
    public sealed record CreateIntRequest(int Value);

    [HttpGet("api/cpu-core-counts")]
    public async Task<ActionResult<IEnumerable<IntOption>>> ListCpuCoreCounts(CancellationToken ct) =>
        Ok(await _db.CpuCoreOptions.Where(o => o.IsActive).OrderBy(o => o.SortOrder)
            .Select(o => new IntOption(o.CpuCoreOptionId, o.CoreCount)).ToListAsync(ct));

    [HttpPost("api/cpu-core-counts")]
    [RequiresPermission("server_inventory", PermissionAction.Create)]
    public async Task<ActionResult<IntOption>> CreateCpuCoreCount([FromBody] CreateIntRequest request, CancellationToken ct)
    {
        if (request.Value <= 0) return BadRequest(new { message = "CPU core count must be positive." });

        var existing = await _db.CpuCoreOptions.FirstOrDefaultAsync(o => o.CoreCount == request.Value, ct);
        if (existing is not null) return Ok(new IntOption(existing.CpuCoreOptionId, existing.CoreCount));

        var maxSort = await _db.CpuCoreOptions.MaxAsync(o => (int?)o.SortOrder, ct) ?? 0;
        var entity = new CpuCoreOption { CoreCount = (short)request.Value, SortOrder = maxSort + 1, IsActive = true };
        _db.CpuCoreOptions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListCpuCoreCounts), new IntOption(entity.CpuCoreOptionId, entity.CoreCount));
    }

    [HttpGet("api/ram-sizes")]
    public async Task<ActionResult<IEnumerable<IntOption>>> ListRamSizes(CancellationToken ct) =>
        Ok(await _db.RamSizeOptions.Where(o => o.IsActive).OrderBy(o => o.SortOrder)
            .Select(o => new IntOption(o.RamSizeOptionId, o.SizeGb)).ToListAsync(ct));

    [HttpPost("api/ram-sizes")]
    [RequiresPermission("server_inventory", PermissionAction.Create)]
    public async Task<ActionResult<IntOption>> CreateRamSize([FromBody] CreateIntRequest request, CancellationToken ct)
    {
        if (request.Value <= 0) return BadRequest(new { message = "RAM size must be positive." });

        var existing = await _db.RamSizeOptions.FirstOrDefaultAsync(o => o.SizeGb == request.Value, ct);
        if (existing is not null) return Ok(new IntOption(existing.RamSizeOptionId, existing.SizeGb));

        var maxSort = await _db.RamSizeOptions.MaxAsync(o => (int?)o.SortOrder, ct) ?? 0;
        var entity = new RamSizeOption { SizeGb = request.Value, SortOrder = maxSort + 1, IsActive = true };
        _db.RamSizeOptions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListRamSizes), new IntOption(entity.RamSizeOptionId, entity.SizeGb));
    }

    [HttpGet("api/storage-sizes-gb")]
    public async Task<ActionResult<IEnumerable<IntOption>>> ListStorageSizesGb(CancellationToken ct) =>
        Ok(await _db.StorageSizeOptionsGbs.Where(o => o.IsActive).OrderBy(o => o.SortOrder)
            .Select(o => new IntOption(o.StorageSizeGbId, o.SizeGb)).ToListAsync(ct));

    [HttpPost("api/storage-sizes-gb")]
    [RequiresPermission("server_inventory", PermissionAction.Create)]
    public async Task<ActionResult<IntOption>> CreateStorageSizeGb([FromBody] CreateIntRequest request, CancellationToken ct)
    {
        if (request.Value <= 0) return BadRequest(new { message = "Storage size must be positive." });

        var existing = await _db.StorageSizeOptionsGbs.FirstOrDefaultAsync(o => o.SizeGb == request.Value, ct);
        if (existing is not null) return Ok(new IntOption(existing.StorageSizeGbId, existing.SizeGb));

        var maxSort = await _db.StorageSizeOptionsGbs.MaxAsync(o => (int?)o.SortOrder, ct) ?? 0;
        var entity = new StorageSizeOptionsGb { SizeGb = request.Value, SortOrder = maxSort + 1, IsActive = true };
        _db.StorageSizeOptionsGbs.Add(entity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListStorageSizesGb), new IntOption(entity.StorageSizeGbId, entity.SizeGb));
    }

    [HttpGet("api/storage-sizes-tb")]
    public async Task<ActionResult<IEnumerable<IntOption>>> ListStorageSizesTb(CancellationToken ct) =>
        Ok(await _db.StorageSizeOptionsTbs.Where(o => o.IsActive).OrderBy(o => o.SortOrder)
            .Select(o => new IntOption(o.StorageSizeTbId, o.SizeTb)).ToListAsync(ct));

    [HttpPost("api/storage-sizes-tb")]
    [RequiresPermission("server_inventory", PermissionAction.Create)]
    public async Task<ActionResult<IntOption>> CreateStorageSizeTb([FromBody] CreateIntRequest request, CancellationToken ct)
    {
        if (request.Value <= 0) return BadRequest(new { message = "Storage size must be positive." });

        var existing = await _db.StorageSizeOptionsTbs.FirstOrDefaultAsync(o => o.SizeTb == request.Value, ct);
        if (existing is not null) return Ok(new IntOption(existing.StorageSizeTbId, existing.SizeTb));

        var maxSort = await _db.StorageSizeOptionsTbs.MaxAsync(o => (int?)o.SortOrder, ct) ?? 0;
        var entity = new StorageSizeOptionsTb { SizeTb = request.Value, SortOrder = maxSort + 1, IsActive = true };
        _db.StorageSizeOptionsTbs.Add(entity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListStorageSizesTb), new IntOption(entity.StorageSizeTbId, entity.SizeTb));
    }
}
