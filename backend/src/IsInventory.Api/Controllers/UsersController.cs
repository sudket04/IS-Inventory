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
[Authorize(Policy = "Admin")]
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
        DateTimeOffset? LastLoginAt, bool MustChangePassword);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItem>>> List(CancellationToken ct)
    {
        var users = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Department)
            .OrderBy(u => u.Username)
            .Select(u => new UserListItem(
                u.UserId, u.Username, u.Email, u.FullName,
                u.Role.Code, u.Role.Name, u.Department != null ? u.Department.Name : null, u.IsActive,
                u.LastLoginAt, u.MustChangePassword))
            .ToListAsync(ct);

        return Ok(users);
    }

    public sealed record CreateUserRequest(
        string Username, string Email, string FullName, string InitialPassword,
        int RoleId, int? DepartmentId, string? Phone);

    [HttpPost]
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

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasher.Hash(request.InitialPassword),
            RoleId = request.RoleId,
            DepartmentId = request.DepartmentId,
            Phone = request.Phone,
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
            null, user.IsActive, null, user.MustChangePassword));
    }

    public sealed record UpdateUserRequest(string FullName, int RoleId, int? DepartmentId, string? Phone, bool IsActive);

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync([id], ct);
        if (user is null)
        {
            return NotFound();
        }

        if (!await _db.Roles.AnyAsync(r => r.RoleId == request.RoleId, ct))
        {
            return BadRequest(new { error = "invalid_role", message = "Role does not exist." });
        }

        var wasActive = user.IsActive;
        user.FullName = request.FullName.Trim();
        user.RoleId = request.RoleId;
        user.DepartmentId = request.DepartmentId;
        user.Phone = request.Phone;
        user.IsActive = request.IsActive;
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
