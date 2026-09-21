using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using IsInventory.Api.Excel;
using IsInventory.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Reports;

/// <summary>FR-DB-05/06 — the four canned reports the PRD calls out by name: assets near
/// warranty/license expiry, license compliance, assets by status, and total asset value.
/// Each has a matching /export route returning the same rows as an .xlsx via ExcelExporter.
/// Not exposed to VIEWER — matches nav.ts, which never lists "Reports" for that role.</summary>
[ApiController]
[Route("api/reports")]
[Authorize]
[RequiresPermission("reports", PermissionAction.View)]
public sealed class ReportsController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public ReportsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    // ---- 1. Expiring coverage (warranty + license, driven by vw_expiring_assets) ----

    [HttpGet("expiring-coverage")]
    public async Task<ActionResult<IReadOnlyList<ExpiringCoverageItem>>> ExpiringCoverage(
        [FromQuery] int withinDays = 90, CancellationToken ct = default) =>
        Ok(await ExpiringCoverageQuery(withinDays).ToListAsync(ct));

    [HttpGet("expiring-coverage/export")]
    public async Task<IActionResult> ExpiringCoverageExport([FromQuery] int withinDays = 90, CancellationToken ct = default)
    {
        var items = await ExpiringCoverageQuery(withinDays).ToListAsync(ct);
        var headers = new[] { "Asset Tag", "Name", "Category", "Contract No", "Vendor", "Coverage End", "Days Remaining", "Severity", "Owner", "Location" };
        var rows = items.Select(i => (IReadOnlyList<object?>)new object?[]
        {
            i.AssetTag, i.Name, i.CategoryName, i.ContractNo, i.VendorName,
            i.CoverageEndDate, i.DaysRemaining, i.Severity, i.OwnerName, i.LocationName,
        });
        return File(ExcelExporter.Build("Expiring Coverage", headers, rows), ExcelExporter.ContentType, "expiring-coverage.xlsx");
    }

    private IQueryable<ExpiringCoverageItem> ExpiringCoverageQuery(int withinDays) =>
        _db.VwExpiringAssets
            .Where(a => a.Severity == "EXPIRED" || (a.DaysRemaining != null && a.DaysRemaining <= withinDays))
            .OrderBy(a => a.CoverageEndDate)
            .Select(a => new ExpiringCoverageItem(
                a.AssetId, a.AssetTag, a.Name, a.CategoryCode, a.CategoryName,
                a.ContractNo, a.VendorName, a.CoverageEndDate, a.DaysRemaining,
                a.Severity, a.OwnerName, a.LocationName));

    // ---- 2. License compliance (seat usage, driven by vw_software_seat_usage) ----

    [HttpGet("license-compliance")]
    public async Task<ActionResult<IReadOnlyList<LicenseComplianceItem>>> LicenseCompliance(CancellationToken ct) =>
        Ok(await LicenseComplianceQuery().ToListAsync(ct));

    [HttpGet("license-compliance/export")]
    public async Task<IActionResult> LicenseComplianceExport(CancellationToken ct)
    {
        var items = await LicenseComplianceQuery().ToListAsync(ct);
        var headers = new[] { "Asset Tag", "Software", "Publisher", "License Type", "Seats Purchased", "Seats Used", "Seats Available", "Over-deployed", "Over-deployed By", "License End", "Contract No", "Vendor" };
        var rows = items.Select(i => (IReadOnlyList<object?>)new object?[]
        {
            i.AssetTag, i.SoftwareName, i.Publisher, i.LicenseType, i.SeatsPurchased, i.SeatsUsed,
            i.SeatsAvailable, i.IsOverDeployed, i.OverDeployedCount, i.LicenseEndDate, i.CurrentContractNo, i.VendorName,
        });
        return File(ExcelExporter.Build("License Compliance", headers, rows), ExcelExporter.ContentType, "license-compliance.xlsx");
    }

    private IQueryable<LicenseComplianceItem> LicenseComplianceQuery() =>
        _db.VwSoftwareSeatUsages
            .OrderByDescending(s => s.IsOverDeployed)
            .ThenBy(s => s.SoftwareName)
            .Select(s => new LicenseComplianceItem(
                s.AssetId, s.AssetTag, s.SoftwareName, s.Publisher, s.LicenseType,
                s.SeatsPurchased, s.SeatsUsed, s.SeatsAvailable, s.IsOverDeployed == true, s.OverDeployedCount,
                s.LicenseEndDate, s.CurrentContractNo, s.VendorName));

    // ---- 3. Assets by status (category x status pivot) ----

    [HttpGet("assets-by-status")]
    public async Task<ActionResult<AssetsByStatusReport>> AssetsByStatus(CancellationToken ct) =>
        Ok(await AssetsByStatusData(ct));

    [HttpGet("assets-by-status/export")]
    public async Task<IActionResult> AssetsByStatusExport(CancellationToken ct)
    {
        var report = await AssetsByStatusData(ct);
        var headers = new[] { "Category", "Status", "Count" };
        var rows = report.Rows.Select(r => (IReadOnlyList<object?>)new object?[] { r.CategoryName, r.StatusName, r.Count });
        return File(ExcelExporter.Build("Assets by Status", headers, rows), ExcelExporter.ContentType, "assets-by-status.xlsx");
    }

    private async Task<AssetsByStatusReport> AssetsByStatusData(CancellationToken ct)
    {
        var rows = await _db.Assets
            .Where(a => !a.IsDeleted)
            .GroupBy(a => new
            {
                CategoryCode = a.Category.Code, CategoryName = a.Category.Name, CategorySort = a.Category.SortOrder,
                StatusCode = a.Status.Code, StatusName = a.Status.Name, a.Status.ColorToken, StatusSort = a.Status.SortOrder,
            })
            .Select(g => new { g.Key.CategoryCode, g.Key.CategoryName, g.Key.CategorySort, g.Key.StatusCode, g.Key.StatusName, g.Key.ColorToken, g.Key.StatusSort, Count = g.Count() })
            .OrderBy(g => g.CategorySort).ThenBy(g => g.StatusSort)
            .ToListAsync(ct);

        var mapped = rows.Select(r => new AssetsByStatusRow(r.CategoryCode, r.CategoryName, r.StatusCode, r.StatusName, r.ColorToken, r.Count)).ToList();
        return new AssetsByStatusReport(mapped, mapped.Sum(r => r.Count));
    }

    // ---- 4. Asset value / TCO (driven by vw_asset_tco) ----

    [HttpGet("asset-value")]
    public async Task<ActionResult<AssetValueReport>> AssetValue(CancellationToken ct) =>
        Ok(await AssetValueData(ct));

    [HttpGet("asset-value/export")]
    public async Task<IActionResult> AssetValueExport(CancellationToken ct)
    {
        var report = await AssetValueData(ct);
        var headers = new[] { "Asset Tag", "Name", "Category", "Department", "Location", "Purchase Price", "Currency", "Contract Cost To Date", "Total Cost of Ownership" };
        var rows = report.Items.Select(i => (IReadOnlyList<object?>)new object?[]
        {
            i.AssetTag, i.Name, i.CategoryName, i.DepartmentName, i.LocationName,
            i.PurchasePrice, i.Currency, i.TotalContractCost, i.TotalCostOfOwnership,
        });
        return File(ExcelExporter.Build("Asset Value", headers, rows), ExcelExporter.ContentType, "asset-value.xlsx");
    }

    private async Task<AssetValueReport> AssetValueData(CancellationToken ct)
    {
        var items = await (
            from tco in _db.VwAssetTcos
            join a in _db.Assets on tco.AssetId equals a.AssetId
            where !a.IsDeleted
            orderby tco.TotalCostOfOwnership descending
            select new AssetValueItem(
                tco.AssetId, tco.AssetTag, tco.AssetName, a.Category.Code, a.Category.Name,
                a.Department != null ? a.Department.Name : null, a.Location != null ? a.Location.Name : null,
                tco.PurchasePrice, tco.Currency, tco.TotalContractCost, tco.TotalCostOfOwnership))
            .ToListAsync(ct);

        return new AssetValueReport(items, items.Sum(i => i.PurchasePrice ?? 0), items.Sum(i => i.TotalCostOfOwnership ?? 0), items.Count);
    }
}
