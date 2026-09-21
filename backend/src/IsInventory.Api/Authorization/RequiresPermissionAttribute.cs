using System.Security.Claims;
using IsInventory.Domain.Security;
using Microsoft.AspNetCore.Mvc.Filters;

namespace IsInventory.Api.Authorization;

/// <summary>
/// Per-menu, per-action authorization — supersedes the old fixed [Authorize(Policy=...)]
/// role checks. Effective permission is computed by IPermissionService (role default,
/// overridable per user in dbo.user_menu_permissions). The caller must still be
/// authenticated (class/controller-level [Authorize] is expected above this).
///
/// Implemented as IAsyncAuthorizationFilter (not IAsyncActionFilter) so it runs in the same
/// early pipeline stage as [Authorize] — before model binding/validation. An action filter
/// would run too late: [ApiController]'s automatic 400 response for an invalid body fires
/// from the action-filter stage too, and would win the race, letting an unauthorized caller
/// learn about validation errors before ever being told they can't call the endpoint.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class RequiresPermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _menuKeys;
    private readonly PermissionAction _action;

    public RequiresPermissionAttribute(string menuKey, PermissionAction action)
    {
        _menuKeys = [menuKey];
        _action = action;
    }

    /// <summary>
    /// OR-across-menus overload for the handful of sub-resources that legitimately belong to
    /// more than one parent menu (e.g. an attachment row can hang off an Asset or a Contract) —
    /// allowed if the caller has the action on any one of the given menus.
    /// </summary>
    public RequiresPermissionAttribute(PermissionAction action, params string[] menuKeys)
    {
        _menuKeys = menuKeys;
        _action = action;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
            return;
        }

        var permissionService = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var permissions = await permissionService.GetEffectivePermissionsAsync(userId, context.HttpContext.RequestAborted);
        var allowed = _menuKeys.Any(key => permissions.TryGetValue(key, out var perm) && perm.Has(_action));
        if (!allowed)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.ObjectResult(new { error = "forbidden", message = "You do not have permission for this action." })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
        }
    }
}
