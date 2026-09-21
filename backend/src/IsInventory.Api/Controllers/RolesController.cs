using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
[RequiresPermission("admin_users", PermissionAction.View)]
public sealed class RolesController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public RolesController(IsInventoryDbContext db)
    {
        _db = db;
    }

    public sealed record RoleItem(int RoleId, string Code, string Name);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleItem>>> List(CancellationToken ct)
    {
        var roles = await _db.Roles
            .OrderBy(r => r.SortOrder)
            .Select(r => new RoleItem(r.RoleId, r.Code, r.Name))
            .ToListAsync(ct);
        return Ok(roles);
    }
}
