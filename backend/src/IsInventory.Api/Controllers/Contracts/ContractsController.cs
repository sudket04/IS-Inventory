using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Api.Controllers.Assets;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Contracts;

/// <summary>
/// v1.4 module (docs/database/12-module-v1.4-contracts-temporal.sql): dbo.contracts +
/// dbo.contract_assets, covering both single-asset and multi-asset contracts (a contract
/// covers whichever assets have a contract_assets row) plus renewal chains
/// (previous_contract_id — trg_contracts_supersede auto-closes the prior contract to
/// SUPERSEDED and rejects a renewal that starts before the contract it renews). Like
/// Racks/Clusters, dbo.contracts has no is_deleted column, so Delete is a genuine hard
/// delete blocked with a friendly 409 when still referenced.
/// </summary>
[ApiController]
[Authorize]
[RequiresPermission("contracts", PermissionAction.View)]
public sealed class ContractsController : ControllerBase
{
    private const int MaxPageSize = 100;

    private readonly IsInventoryDbContext _db;

    public ContractsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    // --- Contracts ---

    [HttpGet("api/contracts")]
    public async Task<ActionResult<PagedResult<ContractListItem>>> List(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? contractType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Contracts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            query = query.Where(c =>
                EF.Functions.Like(c.ContractNo, $"%{needle}%") ||
                (c.VendorContractNo != null && EF.Functions.Like(c.VendorContractNo, $"%{needle}%")) ||
                (c.Vendor != null && EF.Functions.Like(c.Vendor.Name, $"%{needle}%")));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(contractType))
        {
            query = query.Where(c => c.ContractType == contractType);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(c => c.EndDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContractListItem(
                c.ContractId, c.ContractNo, c.VendorContractNo, c.ContractType,
                c.Vendor != null ? c.Vendor.Name : null, c.StartDate, c.EndDate, c.Status,
                c.ContractValue, c.Currency, c.ContractAssets.Count, c.AutoRenew))
            .ToListAsync(ct);

        return Ok(new PagedResult<ContractListItem>(items, totalCount, page, pageSize));
    }

    [HttpGet("api/contracts/{id:int}")]
    public async Task<ActionResult<ContractDetail>> Get(int id, CancellationToken ct)
    {
        var detail = await GetDetail(id, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost("api/contracts")]
    [RequiresPermission("contracts", PermissionAction.Create)]
    public async Task<ActionResult<ContractDetail>> Create([FromBody] ContractRequest request, CancellationToken ct)
    {
        var entity = new Contract();
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.Contracts.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Contract number '{request.ContractNo}' already exists." });
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("CREATE", entity.ContractId, entity.ContractNo, ct);
        return Ok(await GetDetail(entity.ContractId, ct));
    }

    [HttpPut("api/contracts/{id:int}")]
    [RequiresPermission("contracts", PermissionAction.Edit)]
    public async Task<ActionResult<ContractDetail>> Update(int id, [FromBody] ContractRequest request, CancellationToken ct)
    {
        var entity = await _db.Contracts.FirstOrDefaultAsync(c => c.ContractId == id, ct);
        if (entity is null) return NotFound();

        Apply(entity, request);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedBy = CurrentUserId();

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Contract number '{request.ContractNo}' already exists." });
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("UPDATE", entity.ContractId, entity.ContractNo, ct);
        return Ok(await GetDetail(entity.ContractId, ct));
    }

    [HttpDelete("api/contracts/{id:int}")]
    [RequiresPermission("contracts", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Contracts.FirstOrDefaultAsync(c => c.ContractId == id, ct);
        if (entity is null) return NotFound();

        _db.Contracts.Remove(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckOrFkViolation(ex))
        {
            return Conflict(new { message = "Cannot delete this contract — it still covers assets, has attachments, or another contract renews from it. Remove those first." });
        }

        await LogAsync("DELETE", id, entity.ContractNo, ct);
        return NoContent();
    }

    // --- Contract Assets (single-asset and multi-asset coverage) ---

    [HttpGet("api/contracts/{contractId:int}/assets")]
    public async Task<ActionResult<IReadOnlyList<ContractAssetItem>>> Assets(int contractId, CancellationToken ct) =>
        Ok(await AssetQuery(_db.ContractAssets
                .Where(ca => ca.ContractId == contractId)
                .OrderByDescending(ca => ca.CoverageEnd))
            .ToListAsync(ct));

    [HttpPost("api/contracts/{contractId:int}/assets")]
    [RequiresPermission("contracts", PermissionAction.Create)]
    public async Task<ActionResult<ContractAssetItem>> AddAsset(
        int contractId, [FromBody] ContractAssetCreateRequest request, CancellationToken ct)
    {
        var contractExists = await _db.Contracts.AnyAsync(c => c.ContractId == contractId, ct);
        if (!contractExists) return NotFound(new { message = "Contract not found." });

        var assetExists = await _db.Assets.AnyAsync(a => a.AssetId == request.AssetId && !a.IsDeleted, ct);
        if (!assetExists) return BadRequest(new { message = "Asset does not exist." });

        var entity = new ContractAsset
        {
            ContractId = contractId,
            AssetId = request.AssetId,
            CoverageStart = request.CoverageStart,
            CoverageEnd = request.CoverageEnd,
            AllocatedCost = request.AllocatedCost,
            SeatCount = request.SeatCount,
            ServiceLevelNote = request.ServiceLevelNote,
            Notes = request.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedBy = CurrentUserId(),
        };
        _db.ContractAssets.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This asset is already linked to this contract." });
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("CREATE", entity.ContractAssetId, $"contract #{contractId} ↔ asset #{request.AssetId}", ct);
        return Ok(await AssetQuery(_db.ContractAssets.Where(ca => ca.ContractAssetId == entity.ContractAssetId)).FirstAsync(ct));
    }

    [HttpPut("api/contracts/{contractId:int}/assets/{contractAssetId:int}")]
    [RequiresPermission("contracts", PermissionAction.Edit)]
    public async Task<ActionResult<ContractAssetItem>> UpdateAsset(
        int contractId, int contractAssetId, [FromBody] ContractAssetUpdateRequest request, CancellationToken ct)
    {
        var entity = await _db.ContractAssets.FirstOrDefaultAsync(
            ca => ca.ContractAssetId == contractAssetId && ca.ContractId == contractId, ct);
        if (entity is null) return NotFound();

        entity.CoverageStart = request.CoverageStart;
        entity.CoverageEnd = request.CoverageEnd;
        entity.AllocatedCost = request.AllocatedCost;
        entity.SeatCount = request.SeatCount;
        entity.ServiceLevelNote = request.ServiceLevelNote;
        entity.Notes = request.Notes;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedBy = CurrentUserId();

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("UPDATE", entity.ContractAssetId, $"contract #{contractId} ↔ asset #{entity.AssetId}", ct);
        return Ok(await AssetQuery(_db.ContractAssets.Where(ca => ca.ContractAssetId == contractAssetId)).FirstAsync(ct));
    }

    [HttpDelete("api/contracts/{contractId:int}/assets/{contractAssetId:int}")]
    [RequiresPermission("contracts", PermissionAction.Delete)]
    public async Task<IActionResult> RemoveAsset(int contractId, int contractAssetId, CancellationToken ct)
    {
        var entity = await _db.ContractAssets.FirstOrDefaultAsync(
            ca => ca.ContractAssetId == contractAssetId && ca.ContractId == contractId, ct);
        if (entity is null) return NotFound();

        _db.ContractAssets.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", contractAssetId, $"contract #{contractId} ↔ asset #{entity.AssetId}", ct);
        return NoContent();
    }

    // --- helpers ---

    private static IQueryable<ContractAssetItem> AssetQuery(IQueryable<ContractAsset> source) =>
        source.Select(ca => new ContractAssetItem(
            ca.ContractAssetId, ca.AssetId, ca.Asset.AssetTag, ca.Asset.Name,
            ca.CoverageStart, ca.CoverageEnd, ca.AllocatedCost, ca.SeatCount, ca.ServiceLevelNote, ca.Notes));

    private async Task<ContractDetail?> GetDetail(int id, CancellationToken ct) =>
        await _db.Contracts
            .Where(c => c.ContractId == id)
            .Select(c => new ContractDetail(
                c.ContractId, c.ContractNo, c.VendorContractNo, c.ContractType,
                c.VendorId, c.Vendor != null ? c.Vendor.Name : null,
                c.PreviousContractId, c.PreviousContract != null ? c.PreviousContract.ContractNo : null,
                c.StartDate, c.EndDate, c.ContractValue, c.Currency, c.ExchangeRate,
                c.PoNumber, c.CoverageHours, c.ServiceType, c.SlaResponseHours, c.SlaResolutionHours,
                c.AutoRenew, c.RenewalNoticeDays, c.Status,
                c.OwnerUserId, c.OwnerUser != null ? c.OwnerUser.FullName : null,
                c.ContactPerson, c.ContactPhone, c.ContactEmail,
                c.Notes, c.CreatedAt, c.UpdatedAt))
            .FirstOrDefaultAsync(ct);

    private static void Apply(Contract e, ContractRequest d)
    {
        e.ContractNo = d.ContractNo.Trim();
        e.VendorContractNo = d.VendorContractNo;
        e.ContractType = d.ContractType;
        e.VendorId = d.VendorId;
        e.PreviousContractId = d.PreviousContractId;
        e.StartDate = d.StartDate;
        e.EndDate = d.EndDate;
        e.ContractValue = d.ContractValue;
        e.Currency = string.IsNullOrWhiteSpace(d.Currency) ? "THB" : d.Currency;
        e.ExchangeRate = d.ExchangeRate;
        e.PoNumber = d.PoNumber;
        e.CoverageHours = d.CoverageHours;
        e.ServiceType = d.ServiceType;
        e.SlaResponseHours = d.SlaResponseHours;
        e.SlaResolutionHours = d.SlaResolutionHours;
        e.AutoRenew = d.AutoRenew;
        e.RenewalNoticeDays = d.RenewalNoticeDays;
        e.Status = d.Status;
        e.OwnerUserId = d.OwnerUserId;
        e.ContactPerson = d.ContactPerson;
        e.ContactPhone = d.ContactPhone;
        e.ContactEmail = d.ContactEmail;
        e.Notes = d.Notes;
    }

    private async Task LogAsync(string action, int entityId, string label, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "contract",
            EntityId = entityId,
            EntityLabel = label,
        });
        await _db.SaveChangesAsync(ct);
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627);

    private static bool IsCheckOrFkViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;

    /// <summary>
    /// Covers both CHECK-constraint violations (547) and trg_contracts_supersede's own
    /// THROW 51040 (a renewal contract starting before the contract it renews) — the
    /// trigger's message is already friendly, so it's passed through as-is.
    /// </summary>
    private static bool TryGetFriendlyMessage(DbUpdateException ex, out string message)
    {
        if (ex.InnerException is not SqlException sqlEx)
        {
            message = string.Empty;
            return false;
        }

        if (sqlEx.Number == 51040)
        {
            message = sqlEx.Message;
            return true;
        }

        if (sqlEx.Number != 547)
        {
            message = string.Empty;
            return false;
        }

        var text = sqlEx.Message;
        message = text switch
        {
            _ when text.Contains("CK_contracts_dates") => "Contract end date must not be before the start date.",
            _ when text.Contains("CK_contracts_value") => "Contract value must not be negative.",
            _ when text.Contains("CK_contracts_not_self") => "A contract cannot renew from itself.",
            _ when text.Contains("CK_contracts_type") => "Contract type is not one of the recognized options.",
            _ when text.Contains("CK_contracts_status") => "Contract status is not one of the recognized options.",
            _ when text.Contains("CK_contracts_hours") => "Coverage hours must be one of 5x8, 8x5, 12x5, 24x5, 24x7.",
            _ when text.Contains("CK_contracts_service") => "Service type is not one of the recognized options.",
            _ when text.Contains("CK_ca_dates") => "Coverage end date must not be before the coverage start date.",
            _ when text.Contains("CK_ca_cost") => "Allocated cost must not be negative.",
            _ when text.Contains("CK_ca_seats") => "Seat count must be greater than zero.",
            _ => "This contract violates a data rule. Check dates, value, and status.",
        };
        return true;
    }
}
