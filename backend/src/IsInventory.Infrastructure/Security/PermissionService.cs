using IsInventory.Domain.Security;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Infrastructure.Security;

public sealed class PermissionService : IPermissionService
{
    private readonly IsInventoryDbContext _db;

    public PermissionService(IsInventoryDbContext db)
    {
        _db = db;
    }

    public async Task<bool> HasPermissionAsync(int userId, string menuKey, PermissionAction action, CancellationToken ct = default)
    {
        var permissions = await GetEffectivePermissionsAsync(userId, ct);
        return permissions.TryGetValue(menuKey, out var perm) && perm.Has(action);
    }

    public async Task<IReadOnlyDictionary<string, MenuPermission>> GetEffectivePermissionsAsync(int userId, CancellationToken ct = default)
    {
        var roleId = await _db.Users.Where(u => u.UserId == userId).Select(u => (int?)u.RoleId).FirstOrDefaultAsync(ct);
        if (roleId is null)
        {
            return new Dictionary<string, MenuPermission>();
        }

        var roleDefaults = await _db.RoleMenuPermissions
            .Where(rmp => rmp.RoleId == roleId)
            .Select(rmp => new { rmp.Menu.MenuKey, rmp.CanView, rmp.CanCreate, rmp.CanEdit, rmp.CanDelete })
            .ToListAsync(ct);

        var overrides = await _db.UserMenuPermissions
            .Where(ump => ump.UserId == userId)
            .Select(ump => new { ump.Menu.MenuKey, ump.CanView, ump.CanCreate, ump.CanEdit, ump.CanDelete })
            .ToListAsync(ct);

        var overrideByKey = overrides.ToDictionary(o => o.MenuKey);

        var result = new Dictionary<string, MenuPermission>(StringComparer.Ordinal);
        foreach (var role in roleDefaults)
        {
            overrideByKey.TryGetValue(role.MenuKey, out var over);
            result[role.MenuKey] = new MenuPermission(
                CanView: over?.CanView ?? role.CanView,
                CanCreate: over?.CanCreate ?? role.CanCreate,
                CanEdit: over?.CanEdit ?? role.CanEdit,
                CanDelete: over?.CanDelete ?? role.CanDelete);
        }

        return result;
    }
}
