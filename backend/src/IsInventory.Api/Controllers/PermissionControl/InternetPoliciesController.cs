using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.PermissionControl;

/// <summary>
/// v1.5 module — dbo.internet_policies + AD group bindings (internet_policy_groups) and
/// optional web-category rules (internet_policy_categories). proxy_asset_id stays untouched
/// by this controller (always null on write): trg_internet_policies_validate requires the
/// bound asset's asset_type to be one of NET_PROXY/NET_FIREWALL/NET_UTM/NET_WAF, but no
/// screen anywhere in the app can set assets.asset_type_id yet (the Asset Type Tree Picker
/// is still a known gap — ROADMAP.md §1.5 "คงเหลือจาก Sprint 2"). Per the proposal's own
/// design (13-permission-control-proposal.md §1 point 3) the proxy binding is optional —
/// "ชื่อ + AD Group พอ" — so policies are fully usable without it until that picker ships.
/// </summary>
[ApiController]
[Authorize]
[RequiresPermission("internet_policies", PermissionAction.View)]
public sealed class InternetPoliciesController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public InternetPoliciesController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/internet-policies")]
    public async Task<ActionResult<IReadOnlyList<InternetPolicyListItem>>> List(CancellationToken ct) =>
        Ok(await _db.InternetPolicies
            .Where(p => !p.IsDeleted)
            .OrderByDescending(p => p.IsDefault).ThenBy(p => p.PolicyName)
            .Select(p => new InternetPolicyListItem(
                p.PolicyId, p.PolicyCode, p.PolicyName, p.IsDefault, p.IsActive,
                p.InternetPolicyGroups.Count(g => !g.IsDeleted), p.InternetPolicyCategories.Count))
            .ToListAsync(ct));

    [HttpGet("api/internet-policies/{id:int}")]
    public async Task<ActionResult<InternetPolicyDetail>> Get(int id, CancellationToken ct)
    {
        var policy = await _db.InternetPolicies.FirstOrDefaultAsync(p => p.PolicyId == id && !p.IsDeleted, ct);
        if (policy is null) return NotFound();

        return Ok(new InternetPolicyDetail(
            policy.PolicyId, policy.PolicyCode, policy.PolicyName, policy.Description,
            policy.ExternalPolicyRef, policy.IsDefault, policy.IsActive, policy.Notes));
    }

    [HttpPost("api/internet-policies")]
    [RequiresPermission("internet_policies", PermissionAction.Create)]
    public async Task<ActionResult<InternetPolicyDetail>> Create([FromBody] InternetPolicyRequest request, CancellationToken ct)
    {
        var policy = new InternetPolicy
        {
            PolicyCode = request.PolicyCode,
            PolicyName = request.PolicyName,
            Description = request.Description,
            ExternalPolicyRef = request.ExternalPolicyRef,
            IsDefault = request.IsDefault,
            IsActive = request.IsActive,
            Notes = request.Notes,
            CreatedBy = CurrentUserId(),
        };

        _db.InternetPolicies.Add(policy);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "A policy with this code already exists, or a default policy is already set." });
        }

        await LogAsync("CREATE", policy.PolicyId, policy.PolicyName, ct);
        return await Get(policy.PolicyId, ct);
    }

    [HttpPut("api/internet-policies/{id:int}")]
    [RequiresPermission("internet_policies", PermissionAction.Edit)]
    public async Task<ActionResult<InternetPolicyDetail>> Update(int id, [FromBody] InternetPolicyRequest request, CancellationToken ct)
    {
        var policy = await _db.InternetPolicies.FirstOrDefaultAsync(p => p.PolicyId == id && !p.IsDeleted, ct);
        if (policy is null) return NotFound();

        policy.PolicyCode = request.PolicyCode;
        policy.PolicyName = request.PolicyName;
        policy.Description = request.Description;
        policy.ExternalPolicyRef = request.ExternalPolicyRef;
        policy.IsDefault = request.IsDefault;
        policy.IsActive = request.IsActive;
        policy.Notes = request.Notes;
        policy.UpdatedBy = CurrentUserId();
        policy.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "A policy with this code already exists, or a default policy is already set." });
        }

        await LogAsync("UPDATE", policy.PolicyId, policy.PolicyName, ct);
        return await Get(policy.PolicyId, ct);
    }

    [HttpDelete("api/internet-policies/{id:int}")]
    [RequiresPermission("internet_policies", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var policy = await _db.InternetPolicies.FirstOrDefaultAsync(p => p.PolicyId == id && !p.IsDeleted, ct);
        if (policy is null) return NotFound();

        policy.IsDeleted = true;
        policy.UpdatedBy = CurrentUserId();
        policy.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", policy.PolicyId, policy.PolicyName, ct);
        return NoContent();
    }

    // --- AD Group bindings ---

    [HttpGet("api/internet-policies/{policyId:int}/groups")]
    public async Task<ActionResult<IReadOnlyList<PolicyGroupItem>>> Groups(int policyId, CancellationToken ct) =>
        Ok(await _db.InternetPolicyGroups
            .Where(g => g.PolicyId == policyId && !g.IsDeleted)
            .OrderBy(g => g.AdGroupNameRaw)
            .Select(g => new PolicyGroupItem(g.PolicyGroupId, g.AdGroupId, g.AdGroupNameRaw, g.Notes))
            .ToListAsync(ct));

    [HttpPost("api/internet-policies/{policyId:int}/groups")]
    [RequiresPermission("internet_policies", PermissionAction.Create)]
    public async Task<ActionResult<PolicyGroupItem>> AddGroup(int policyId, [FromBody] PolicyGroupRequest request, CancellationToken ct)
    {
        if (!await _db.InternetPolicies.AnyAsync(p => p.PolicyId == policyId && !p.IsDeleted, ct)) return NotFound();

        var group = new InternetPolicyGroup
        {
            PolicyId = policyId,
            AdGroupId = request.AdGroupId,
            AdGroupNameRaw = request.AdGroupNameRaw,
            Notes = request.Notes,
            CreatedBy = CurrentUserId(),
        };

        _db.InternetPolicyGroups.Add(group);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This AD group is already bound to this policy." });
        }

        await LogAsync("CREATE", policyId, $"Bind {request.AdGroupNameRaw} to policy #{policyId}", ct);
        return Ok(new PolicyGroupItem(group.PolicyGroupId, group.AdGroupId, group.AdGroupNameRaw, group.Notes));
    }

    [HttpDelete("api/internet-policies/{policyId:int}/groups/{policyGroupId:int}")]
    [RequiresPermission("internet_policies", PermissionAction.Delete)]
    public async Task<IActionResult> RemoveGroup(int policyId, int policyGroupId, CancellationToken ct)
    {
        var group = await _db.InternetPolicyGroups.FirstOrDefaultAsync(g => g.PolicyGroupId == policyGroupId && g.PolicyId == policyId && !g.IsDeleted, ct);
        if (group is null) return NotFound();

        group.IsDeleted = true;
        group.UpdatedBy = CurrentUserId();
        group.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", policyId, $"Unbind {group.AdGroupNameRaw} from policy #{policyId}", ct);
        return NoContent();
    }

    // --- Optional web-category rules ---

    [HttpGet("api/internet-policies/{policyId:int}/categories")]
    public async Task<ActionResult<IReadOnlyList<PolicyCategoryItem>>> Categories(int policyId, CancellationToken ct) =>
        Ok(await _db.InternetPolicyCategories
            .Where(c => c.PolicyId == policyId)
            .OrderBy(c => c.Category.SortOrder)
            .Select(c => new PolicyCategoryItem(c.PolicyCategoryId, c.CategoryId, c.Category.NameEn, c.PolicyAction, c.Notes))
            .ToListAsync(ct));

    [HttpPost("api/internet-policies/{policyId:int}/categories")]
    [RequiresPermission("internet_policies", PermissionAction.Create)]
    public async Task<ActionResult<PolicyCategoryItem>> AddCategory(int policyId, [FromBody] PolicyCategoryRequest request, CancellationToken ct)
    {
        if (!await _db.InternetPolicies.AnyAsync(p => p.PolicyId == policyId && !p.IsDeleted, ct)) return NotFound();

        var category = new InternetPolicyCategory
        {
            PolicyId = policyId,
            CategoryId = request.CategoryId,
            PolicyAction = request.PolicyAction,
            Notes = request.Notes,
        };

        _db.InternetPolicyCategories.Add(category);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = "This web category already has a rule on this policy." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Policy action must be ALLOW, BLOCK, or WARN." });
        }

        var name = await _db.WebCategories.Where(c => c.CategoryId == request.CategoryId).Select(c => c.NameEn).FirstAsync(ct);
        await LogAsync("CREATE", policyId, $"{request.PolicyAction} {name} on policy #{policyId}", ct);
        return Ok(new PolicyCategoryItem(category.PolicyCategoryId, category.CategoryId, name, category.PolicyAction, category.Notes));
    }

    [HttpDelete("api/internet-policies/{policyId:int}/categories/{policyCategoryId:int}")]
    [RequiresPermission("internet_policies", PermissionAction.Delete)]
    public async Task<IActionResult> RemoveCategory(int policyId, int policyCategoryId, CancellationToken ct)
    {
        var category = await _db.InternetPolicyCategories.FirstOrDefaultAsync(c => c.PolicyCategoryId == policyCategoryId && c.PolicyId == policyId, ct);
        if (category is null) return NotFound();

        _db.InternetPolicyCategories.Remove(category);
        await _db.SaveChangesAsync(ct);

        await LogAsync("DELETE", policyId, $"Remove category rule from policy #{policyId}", ct);
        return NoContent();
    }

    private async Task LogAsync(string action, int entityId, string label, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "internet_policy",
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

    private static bool IsCheckViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;
}
