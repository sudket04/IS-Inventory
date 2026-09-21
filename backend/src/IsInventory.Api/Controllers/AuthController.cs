using System.Security.Claims;
using System.Text.RegularExpressions;
using IsInventory.Domain.Auth;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed partial class AuthController : ControllerBase
{
    private const string RefreshCookieName = "is_inventory_refresh";

    private readonly IAuthService _authService;
    private readonly IsInventoryDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public AuthController(IAuthService authService, IsInventoryDbContext db, IPasswordHasher passwordHasher)
    {
        _authService = authService;
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public sealed record LoginRequest(string Username, string Password);

    public sealed record LoginResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, AuthenticatedUser User);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(
            request.Username?.Trim() ?? string.Empty,
            request.Password ?? string.Empty,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            ct);

        if (!result.Succeeded)
        {
            return result.FailureReason switch
            {
                // ไม่ระบุว่าผิดที่ Username หรือ Password — ป้องกัน User Enumeration
                AuthFailureReason.AccountLocked => StatusCode(StatusCodes.Status423Locked, new
                {
                    error = "account_locked",
                    message = "Account is temporarily locked due to too many failed login attempts. Please try again later or contact an administrator.",
                    lockedUntil = result.LockedUntil,
                }),
                AuthFailureReason.AccountInactive => StatusCode(StatusCodes.Status403Forbidden, new
                {
                    error = "account_inactive",
                    message = "This account has been deactivated. Please contact an administrator.",
                }),
                _ => Unauthorized(new { error = "invalid_credentials", message = "Invalid username or password." }),
            };
        }

        SetRefreshCookie(result.RefreshToken!, result.RefreshTokenExpiresAt!.Value);
        return Ok(new LoginResponse(result.AccessToken!, result.AccessTokenExpiresAt!.Value, result.User!));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Refresh(CancellationToken ct)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) || string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { error = "no_refresh_token", message = "No active session." });
        }

        var result = await _authService.RefreshAsync(
            refreshToken,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            ct);

        if (!result.Succeeded)
        {
            Response.Cookies.Delete(RefreshCookieName);
            return Unauthorized(new { error = "session_expired", message = "Session has expired. Please log in again." });
        }

        SetRefreshCookie(result.RefreshToken!, result.RefreshTokenExpiresAt!.Value);
        return Ok(new LoginResponse(result.AccessToken!, result.AccessTokenExpiresAt!.Value, result.User!));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken, ct);
        }

        Response.Cookies.Delete(RefreshCookieName);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            username = User.FindFirstValue(ClaimTypes.Name),
            fullName = User.FindFirstValue("full_name"),
            role = User.FindFirstValue(ClaimTypes.Role),
        });
    }

    public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    [HttpPut("password")]
    [Authorize]
    public async Task<ActionResult<LoginResponse>> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        if (!PasswordPolicyRegex().IsMatch(request.NewPassword ?? string.Empty))
        {
            return BadRequest(new { error = "weak_password", message = "Password must be at least 8 characters and include both letters and digits." });
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.SingleAsync(u => u.UserId == userId, ct);

        if (!_passwordHasher.Verify(request.CurrentPassword ?? string.Empty, user.PasswordHash))
        {
            return BadRequest(new { error = "invalid_current_password", message = "Current password is incorrect." });
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword!);
        user.MustChangePassword = false;
        user.PasswordChangedAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        user.UpdatedBy = userId;

        _db.AuditLogs.Add(new IsInventory.Infrastructure.Entities.AuditLog
        {
            UserId = userId,
            UsernameSnapshot = user.Username,
            Action = "PASSWORD_CHANGE",
            EntityType = "user",
            EntityId = userId,
            EntityLabel = user.Username,
        });

        await _db.SaveChangesAsync(ct);

        // Mint a fresh token pair so the "must change password" claim/flag clears immediately —
        // otherwise the caller stays locked out by the password-change-required gate (Program.cs)
        // until their old access token naturally expires and a refresh picks up the new state.
        var reissued = await _authService.ReissueForUserAsync(
            userId,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            ct);

        SetRefreshCookie(reissued.RefreshToken!, reissued.RefreshTokenExpiresAt!.Value);
        return Ok(new LoginResponse(reissued.AccessToken!, reissued.AccessTokenExpiresAt!.Value, reissued.User!));
    }

    [GeneratedRegex(@"^(?=.*[A-Za-z])(?=.*\d).{8,}$")]
    private static partial Regex PasswordPolicyRegex();

    private void SetRefreshCookie(string token, DateTimeOffset expiresAt)
    {
        Response.Cookies.Append(RefreshCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAt,
            Path = "/api/auth",
        });
    }
}
