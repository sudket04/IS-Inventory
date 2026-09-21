using IsInventory.Api.Authorization;
using System.Security.Claims;
using System.Text.RegularExpressions;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers;

/// <summary>
/// Admin-only user management (FR-AU-08). Users are never deleted, only deactivated,
/// so the audit trail and every historical foreign key stays intact (FR-AU-09).
/// </summary>
[ApiController]
[Route("api/users")]
[Authorize]
[RequiresPermission("admin_users", PermissionAction.View)]
public sealed partial class UsersController : ControllerBase
{
    private readonly IsInventoryDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public UsersController(IsInventoryDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public sealed record UserListItem(
        int UserId, string Username, string Email, string FullName,
        string RoleCode, string RoleName, string? DepartmentName, bool IsActive,
        DateTimeOffset? LastLoginAt, bool MustChangePassword,
        int SiteId, string SiteName, int TeamId, string TeamName);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItem>>> List(CancellationToken ct)
    {
        var users = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Department)
            .Include(u => u.Site)
            .Include(u => u.Team)
            .OrderBy(u => u.Username)
            .Select(u => new UserListItem(
                u.UserId, u.Username, u.Email, u.FullName,
                u.Role.Code, u.Role.Name, u.Department != null ? u.Department.Name : null, u.IsActive,
                u.LastLoginAt, u.MustChangePassword,
                u.SiteId, u.Site.Name, u.TeamId, u.Team.Name))
            .ToListAsync(ct);

        return Ok(users);
    }

    public sealed record CreateUserRequest(
        string Username, string Email, string FullName, string InitialPassword,
        int RoleId, int? DepartmentId, string? Phone, byte SiteId, byte TeamId);

    [HttpPost]
    [RequiresPermission("admin_users", PermissionAction.Create)]
    public async Task<ActionResult<UserListItem>> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        if (!IsValidPassword(request.InitialPassword))
        {
            return BadRequest(new { error = "weak_password", message = "Password must be at least 8 characters and include both letters and digits." });
        }

        if (await _db.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email, ct))
        {
            return Conflict(new { error = "duplicate_user", message = "Username or email is already in use." });
        }

        var role = await _db.Roles.FindAsync([request.RoleId], ct);
        if (role is null)
        {
            return BadRequest(new { error = "invalid_role", message = "Role does not exist." });
        }

        var site = await _db.UserSites.FindAsync([request.SiteId], ct);
        if (site is null)
        {
            return BadRequest(new { error = "invalid_site", message = "Site does not exist." });
        }

        var team = await _db.UserTeams.FindAsync([request.TeamId], ct);
        if (team is null)
        {
            return BadRequest(new { error = "invalid_team", message = "Team does not exist." });
        }

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasher.Hash(request.InitialPassword),
            RoleId = request.RoleId,
            DepartmentId = request.DepartmentId,
            Phone = request.Phone,
            SiteId = request.SiteId,
            TeamId = request.TeamId,
            IsActive = true,
            MustChangePassword = true,
            CreatedBy = CurrentUserId(),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        AddAudit("CREATE", user.UserId, user.Username, "user");
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(List), new { id = user.UserId }, new UserListItem(
            user.UserId, user.Username, user.Email, user.FullName, role.Code, role.Name,
            null, user.IsActive, null, user.MustChangePassword,
            site.SiteId, site.Name, team.TeamId, team.Name));
    }

    public sealed record UpdateUserRequest(
        string FullName, int RoleId, int? DepartmentId, string? Phone, bool IsActive, byte SiteId, byte TeamId);

    [HttpPut("{id:int}")]
    [RequiresPermission("admin_users", PermissionAction.Edit)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null)
        {
            return NotFound();
        }

        var role = await _db.Roles.FindAsync([request.RoleId], ct);
        if (role is null)
        {
            return BadRequest(new { error = "invalid_role", message = "Role does not exist." });
        }

        if (!await _db.UserSites.AnyAsync(s => s.SiteId == request.SiteId, ct))
        {
            return BadRequest(new { error = "invalid_site", message = "Site does not exist." });
        }

        if (!await _db.UserTeams.AnyAsync(t => t.TeamId == request.TeamId, ct))
        {
            return BadRequest(new { error = "invalid_team", message = "Team does not exist." });
        }

        // Self-protection: an Admin can never touch their own role or active flag — only
        // another Admin account can do that, so one admin can't accidentally (or maliciously)
        // lock themselves out or escalate/demote themselves.
        var isSelf = CurrentUserId() == id;
        if (isSelf && request.RoleId != user.RoleId)
        {
            return Conflict(new { error = "self_role_change", message = "You cannot change your own role." });
        }
        if (isSelf && !request.IsActive)
        {
            return Conflict(new { error = "self_disable", message = "You cannot deactivate your own account." });
        }

        // Guardrail: the system must always keep at least one active Administrator, so demoting
        // or deactivating the last one (even by another admin) is rejected.
        var wasActiveAdmin = user.Role.Code == "ADMIN" && user.IsActive;
        var staysActiveAdmin = role.Code == "ADMIN" && request.IsActive;
        if (wasActiveAdmin && !staysActiveAdmin)
        {
            var otherActiveAdmins = await _db.Users.CountAsync(
                u => u.UserId != id && u.IsActive && u.Role.Code == "ADMIN", ct);
            if (otherActiveAdmins == 0)
            {
                return Conflict(new { error = "last_admin", message = "At least one active Administrator must remain." });
            }
        }

        var wasActive = user.IsActive;
        user.FullName = request.FullName.Trim();
        user.RoleId = request.RoleId;
        user.DepartmentId = request.DepartmentId;
        user.Phone = request.Phone;
        user.IsActive = request.IsActive;
        user.SiteId = request.SiteId;
        user.TeamId = request.TeamId;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        user.UpdatedBy = CurrentUserId();

        AddAudit("UPDATE", user.UserId, user.Username, "user");
        if (wasActive && !request.IsActive)
        {
            // FR-AU-09: ระงับสิทธิ์ด้วยการปิดใช้งาน ไม่ลบข้อมูล
            AddAudit("USER_LOCKED", user.UserId, user.Username, "user");
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record ResetPasswordRequest(string NewPassword);

    [HttpPost("{id:int}/reset-password")]
    [RequiresPermission("admin_users", PermissionAction.Edit)]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        if (!IsValidPassword(request.NewPassword))
        {
            return BadRequest(new { error = "weak_password", message = "Password must be at least 8 characters and include both letters and digits." });
        }

        var user = await _db.Users.FindAsync([id], ct);
        if (user is null)
        {
            return NotFound();
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.MustChangePassword = true;
        user.PasswordChangedAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        user.UpdatedBy = CurrentUserId();

        AddAudit("PASSWORD_RESET", user.UserId, user.Username, "user");
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record MenuPermissionRow(
        string MenuKey, string MenuName,
        bool RoleView, bool RoleCreate, bool RoleEdit, bool RoleDelete,
        bool? OverrideView, bool? OverrideCreate, bool? OverrideEdit, bool? OverrideDelete,
        bool EffectiveView, bool EffectiveCreate, bool EffectiveEdit, bool EffectiveDelete);

    /// <summary>Full matrix (role default + override + effective) for the admin permissions editor.</summary>
    [HttpGet("{id:int}/permissions")]
    [RequiresPermission("admin_users", PermissionAction.View)]
    public async Task<ActionResult<IEnumerable<MenuPermissionRow>>> GetPermissions(int id, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync([id], ct);
        if (user is null) return NotFound();

        var roleDefaults = await _db.RoleMenuPermissions
            .Where(rmp => rmp.RoleId == user.RoleId)
            .Include(rmp => rmp.Menu)
            .OrderBy(rmp => rmp.Menu.SortOrder)
            .ToListAsync(ct);

        var overrides = await _db.UserMenuPermissions
            .Where(ump => ump.UserId == id)
            .ToDictionaryAsync(ump => ump.MenuId, ct);

        var rows = roleDefaults.Select(rd =>
        {
            overrides.TryGetValue(rd.MenuId, out var over);
            return new MenuPermissionRow(
                rd.Menu.MenuKey, rd.Menu.Name,
                rd.CanView, rd.CanCreate, rd.CanEdit, rd.CanDelete,
                over?.CanView, over?.CanCreate, over?.CanEdit, over?.CanDelete,
                over?.CanView ?? rd.CanView, over?.CanCreate ?? rd.CanCreate,
                over?.CanEdit ?? rd.CanEdit, over?.CanDelete ?? rd.CanDelete);
        });

        return Ok(rows);
    }

    public sealed record SetMenuPermissionRequest(bool? CanView, bool? CanCreate, bool? CanEdit, bool? CanDelete);

    /// <summary>
    /// Upserts a per-user override for one menu. Any field left null falls back to inheriting
    /// the role default for that specific action — only the non-null fields actually override.
    /// </summary>
    [HttpPut("{id:int}/permissions/{menuKey}")]
    [RequiresPermission("admin_users", PermissionAction.Edit)]
    public async Task<IActionResult> SetPermission(int id, string menuKey, [FromBody] SetMenuPermissionRequest request, CancellationToken ct)
    {
        if (CurrentUserId() == id)
        {
            return Conflict(new { error = "self_permission_change", message = "You cannot change your own permissions." });
        }

        var user = await _db.Users.FindAsync([id], ct);
        if (user is null) return NotFound();

        var menu = await _db.Menus.FirstOrDefaultAsync(m => m.MenuKey == menuKey, ct);
        if (menu is null) return NotFound(new { error = "invalid_menu", message = "Menu does not exist." });

        var over = await _db.UserMenuPermissions.FindAsync([id, menu.MenuId], ct);
        if (over is null)
        {
            over = new IsInventory.Infrastructure.Entities.UserMenuPermission { UserId = id, MenuId = menu.MenuId };
            _db.UserMenuPermissions.Add(over);
        }

        over.CanView = request.CanView;
        over.CanCreate = request.CanCreate;
        over.CanEdit = request.CanEdit;
        over.CanDelete = request.CanDelete;
        over.UpdatedAt = DateTimeOffset.UtcNow;
        over.UpdatedBy = CurrentUserId();

        AddAudit("SETTING_CHANGE", user.UserId, $"{user.Username}:{menuKey}", "user_menu_permission");
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Clears the override for one menu, reverting the user back to their role default.</summary>
    [HttpDelete("{id:int}/permissions/{menuKey}")]
    [RequiresPermission("admin_users", PermissionAction.Edit)]
    public async Task<IActionResult> ClearPermission(int id, string menuKey, CancellationToken ct)
    {
        if (CurrentUserId() == id)
        {
            return Conflict(new { error = "self_permission_change", message = "You cannot change your own permissions." });
        }

        var menu = await _db.Menus.FirstOrDefaultAsync(m => m.MenuKey == menuKey, ct);
        if (menu is null) return NotFound(new { error = "invalid_menu", message = "Menu does not exist." });

        var over = await _db.UserMenuPermissions.FindAsync([id, menu.MenuId], ct);
        if (over is null) return NoContent();

        _db.UserMenuPermissions.Remove(over);
        AddAudit("SETTING_CHANGE", id, menuKey, "user_menu_permission");
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [GeneratedRegex(@"^(?=.*[A-Za-z])(?=.*\d).{8,}$")]
    private static partial Regex PasswordPolicyRegex();

    private static bool IsValidPassword(string password) => PasswordPolicyRegex().IsMatch(password ?? string.Empty);

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private void AddAudit(string action, int userId, string username, string entityType) =>
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = entityType,
            EntityId = userId,
            EntityLabel = username,
        });
}
