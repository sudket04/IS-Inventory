using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using IsInventory.Infrastructure;

namespace IsInventory.Api.Controllers.Lookups;

/// <summary>
/// Shared CRUD behavior for the 12 master-data pages that share one structure
/// (docs/design/04-settings-screens.md §4): list, create, update, toggle active,
/// and a delete that's blocked — with the usage counts that block it — whenever the
/// record is still referenced, since the schema has no ON DELETE CASCADE anywhere
/// (§5, HANDOFF.md decision #10). Each concrete controller only supplies the DTO,
/// the field mapping, and which tables count as "in use".
/// </summary>
[ApiController]
[Authorize(Policy = "Admin")]
public abstract class LookupsControllerBase<TEntity, TDto> : ControllerBase
    where TEntity : class, new()
{
    public sealed record UsageCount(string Label, Func<IsInventoryDbContext, int, CancellationToken, Task<int>> CountAsync);

    public sealed record UsageResult(string Label, int Count);

    public sealed record SetActiveRequest(bool IsActive);

    protected readonly IsInventoryDbContext Db;

    protected LookupsControllerBase(IsInventoryDbContext db)
    {
        Db = db;
    }

    protected abstract DbSet<TEntity> Set { get; }

    protected abstract int GetId(TEntity entity);

    protected abstract void Apply(TEntity entity, TDto dto);

    protected abstract void SetActiveFlag(TEntity entity, bool value);

    /// <summary>Tables to count as "in use" for the delete guard. Empty for none.</summary>
    protected virtual IReadOnlyList<UsageCount> UsageCounts { get; } = Array.Empty<UsageCount>();

    [HttpGet]
    public virtual async Task<ActionResult<IEnumerable<TEntity>>> List(CancellationToken ct) =>
        Ok(await Set.AsNoTracking().ToListAsync(ct));

    [HttpPost]
    public virtual async Task<ActionResult<TEntity>> Create([FromBody] TDto dto, CancellationToken ct)
    {
        var entity = new TEntity();
        SetActiveFlag(entity, true);
        Apply(entity, dto);
        Set.Add(entity);

        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { error = "duplicate", message = "A record with this code or name already exists." });
        }

        return CreatedAtAction(nameof(List), new { id = GetId(entity) }, entity);
    }

    [HttpPut("{id:int}")]
    public virtual async Task<IActionResult> Update(int id, [FromBody] TDto dto, CancellationToken ct)
    {
        var entity = await Set.FindAsync([id], ct);
        if (entity is null) return NotFound();

        Apply(entity, dto);

        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { error = "duplicate", message = "A record with this code or name already exists." });
        }

        return NoContent();
    }

    [HttpPatch("{id:int}/active")]
    public virtual async Task<IActionResult> SetActive(int id, [FromBody] SetActiveRequest request, CancellationToken ct)
    {
        var entity = await Set.FindAsync([id], ct);
        if (entity is null) return NotFound();

        SetActiveFlag(entity, request.IsActive);
        await Db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("{id:int}/usage")]
    public async Task<ActionResult<IEnumerable<UsageResult>>> GetUsage(int id, CancellationToken ct) =>
        Ok(await ComputeUsageAsync(id, ct));

    [HttpDelete("{id:int}")]
    public virtual async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var usages = await ComputeUsageAsync(id, ct);
        if (usages.Any(u => u.Count > 0))
        {
            return Conflict(new
            {
                error = "in_use",
                message = "Cannot delete — this record is still referenced. Deactivate it instead.",
                usages,
            });
        }

        var entity = await Set.FindAsync([id], ct);
        if (entity is null) return NotFound();

        Set.Remove(entity);
        await Db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<List<UsageResult>> ComputeUsageAsync(int id, CancellationToken ct)
    {
        var results = new List<UsageResult>();
        foreach (var usage in UsageCounts)
        {
            results.Add(new UsageResult(usage.Label, await usage.CountAsync(Db, id, ct)));
        }
        return results;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627);
}
