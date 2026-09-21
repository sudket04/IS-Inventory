using System.Security.Claims;
using KKND.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Dashboard;

/// <summary>
/// FR-DB-01..04 — single aggregate endpoint for the home page. Coverage/expiry comes from
/// dbo.vw_expiring_assets — assets.coverage_end_date was dropped in the v1.4 migration once
/// coverage moved to contract_assets (see vw_asset_coverage), so this view (built for exactly
/// this purpose) is the only correct source for warranty/license expiry now.
/// </summary>
[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = "AnyRole")]
public sealed class DashboardController : ControllerBase
{
    private readonly KkndDbContext _db;

    public DashboardController(KkndDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummary>> Summary(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var assets = _db.Assets.Where(a => !a.IsDeleted);
        var expiring = _db.VwExpiringAssets.AsQueryable();

        var expiredCount = await expiring.CountAsync(a => a.Severity == "EXPIRED", ct);
        var expiring30Count = await expiring.CountAsync(a => a.Severity == "CRITICAL", ct);
        var underRepairCount = await assets.CountAsync(a => a.Status.Code == "UNDER_REPAIR", ct);
        var overDeployedCount = await _db.VwSoftwareSeatUsages.CountAsync(s => s.IsOverDeployed == true, ct);

        var totalAssets = await assets.CountAsync(ct);
        var inUseCount = await assets.CountAsync(a => a.Status.Code == "IN_USE", ct);
        var inStockCount = await assets.CountAsync(a => a.Status.Code == "IN_STOCK", ct);
        var totalValue = await assets.SumAsync(a => (decimal?)a.PurchasePrice, ct);
        var newThisMonth = await assets.CountAsync(a => a.CreatedAt >= monthStart.ToDateTime(TimeOnly.MinValue), ct);

        var byCategory = await assets
            .GroupBy(a => new { a.Category.Code, a.Category.Name, a.Category.IconName, a.Category.SortOrder })
            .Select(g => new { g.Key.Code, g.Key.Name, g.Key.IconName, g.Key.SortOrder, Count = g.Count() })
            .OrderBy(g => g.SortOrder)
            .ToListAsync(ct);

        var byStatus = await assets
            .GroupBy(a => new { a.Status.Code, a.Status.Name, a.Status.ColorToken, a.Status.SortOrder })
            .Select(g => new { g.Key.Code, g.Key.Name, g.Key.ColorToken, g.Key.SortOrder, Count = g.Count() })
            .OrderBy(g => g.SortOrder)
            .ToListAsync(ct);

        var expiringSoon = await expiring
            .Where(a => a.Severity == "EXPIRED" || a.Severity == "CRITICAL" || a.Severity == "WARNING" || a.Severity == "NOTICE")
            .OrderBy(a => a.CoverageEndDate)
            .Take(10)
            .Select(a => new { a.AssetId, a.AssetTag, a.Name, a.CategoryCode, a.CategoryName, a.CoverageEndDate, a.DaysRemaining })
            .ToListAsync(ct);

        IReadOnlyList<RecentActivityItem> recentActivity = Array.Empty<RecentActivityItem>();
        if (User.IsInRole("ADMIN") || User.IsInRole("IT_STAFF") || User.IsInRole("AUDITOR"))
        {
            var auditQuery = _db.AuditLogs.AsQueryable();
            if (User.IsInRole("IT_STAFF") && !User.IsInRole("ADMIN"))
            {
                auditQuery = auditQuery.Where(a => a.UserId == CurrentUserId());
            }

            recentActivity = await auditQuery
                .OrderByDescending(a => a.OccurredAt)
                .Take(8)
                .Select(a => new RecentActivityItem(a.OccurredAt, a.UsernameSnapshot, a.Action, a.EntityType, a.EntityLabel))
                .ToListAsync(ct);
        }

        return Ok(new DashboardSummary(
            new ActionRequiredCards(expiredCount, expiring30Count, overDeployedCount, underRepairCount),
            new OverviewCards(totalAssets, inUseCount, inStockCount, totalValue, newThisMonth),
            byCategory.Select(c => new CategoryBreakdownItem(c.Code, c.Name, c.IconName, c.Count)).ToList(),
            byStatus.Select(s => new StatusBreakdownItem(s.Code, s.Name, s.ColorToken, s.Count)).ToList(),
            expiringSoon.Select(a => new ExpiringSoonItem(
                a.AssetId, a.AssetTag, a.Name, a.CategoryCode, a.CategoryName,
                a.CoverageEndDate!.Value, a.DaysRemaining ?? 0)).ToList(),
            recentActivity));
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }
}
