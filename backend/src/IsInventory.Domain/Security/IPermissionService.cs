namespace IsInventory.Domain.Security;

public enum PermissionAction
{
    View,
    Create,
    Edit,
    Delete,
}

public sealed record MenuPermission(bool CanView, bool CanCreate, bool CanEdit, bool CanDelete)
{
    public bool Has(PermissionAction action) => action switch
    {
        PermissionAction.View => CanView,
        PermissionAction.Create => CanCreate,
        PermissionAction.Edit => CanEdit,
        PermissionAction.Delete => CanDelete,
        _ => false,
    };
}

/// <summary>
/// Effective permission = per-user override (dbo.user_menu_permissions) when set, otherwise
/// the user's role default (dbo.role_menu_permissions). Menus are identified by a stable
/// string key (see dbo.menus), never by controller/route, so URLs can change without
/// invalidating permission data.
/// </summary>
public interface IPermissionService
{
    Task<bool> HasPermissionAsync(int userId, string menuKey, PermissionAction action, CancellationToken ct = default);

    /// <summary>Effective permissions for every menu the user can see anything of — powers nav filtering.</summary>
    Task<IReadOnlyDictionary<string, MenuPermission>> GetEffectivePermissionsAsync(int userId, CancellationToken ct = default);
}
