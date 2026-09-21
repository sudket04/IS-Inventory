using System.Security.Cryptography;
using IsInventory.Domain.Auth;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure.Entities;
using IsInventory.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IsInventory.Infrastructure.Auth;

/// <summary>
/// Implements the login flow from docs/design/01-user-flow.md §2.1: generic error message
/// on bad username/password (no user enumeration), lockout after 5 failed attempts for
/// 15 minutes (FR-AU-03/04), and an audit trail entry for every outcome.
/// </summary>
public sealed class AuthService : IAuthService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly IsInventoryDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtOptions _jwtOptions;

    public AuthService(
        IsInventoryDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IOptions<JwtOptions> jwtOptions)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<AuthResult> LoginAsync(string username, string password, string? ipAddress, string? userAgent, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .SingleOrDefaultAsync(u => u.Username == username, ct);

        if (user is null)
        {
            await WriteAuditAsync(null, username, "LOGIN_FAILED", ipAddress, userAgent, ct);
            return AuthResult.Fail(AuthFailureReason.InvalidCredentials);
        }

        var now = DateTimeOffset.UtcNow;
        if (user.LockedUntil.HasValue && user.LockedUntil.Value > now)
        {
            return AuthResult.Fail(AuthFailureReason.AccountLocked, user.LockedUntil);
        }

        if (!_passwordHasher.Verify(password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            DateTimeOffset? lockedUntil = null;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                lockedUntil = now.Add(LockoutDuration);
                user.LockedUntil = lockedUntil;
            }

            await WriteAuditAsync(user.UserId, username, "LOGIN_FAILED", ipAddress, userAgent, ct);
            if (lockedUntil.HasValue)
            {
                await WriteAuditAsync(user.UserId, username, "USER_LOCKED", ipAddress, userAgent, ct);
            }

            await _db.SaveChangesAsync(ct);

            return lockedUntil.HasValue
                ? AuthResult.Fail(AuthFailureReason.AccountLocked, lockedUntil)
                : AuthResult.Fail(AuthFailureReason.InvalidCredentials);
        }

        if (!user.IsActive)
        {
            await WriteAuditAsync(user.UserId, username, "LOGIN_FAILED", ipAddress, userAgent, ct);
            await _db.SaveChangesAsync(ct);
            return AuthResult.Fail(AuthFailureReason.AccountInactive);
        }

        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginAt = now;
        await WriteAuditAsync(user.UserId, username, "LOGIN", ipAddress, userAgent, ct);

        var result = IssueTokens(user, ipAddress, userAgent);
        await _db.SaveChangesAsync(ct);
        return result;
    }

    public async Task<AuthResult> RefreshAsync(string refreshToken, string? ipAddress, string? userAgent, CancellationToken ct = default)
    {
        var tokenHash = Hash(refreshToken);
        var existing = await _db.RefreshTokens
            .Include(t => t.User)
            .ThenInclude(u => u.Role)
            .SingleOrDefaultAsync(t => t.TokenHash == tokenHash, ct);

        var now = DateTimeOffset.UtcNow;
        if (existing is null || existing.RevokedAt.HasValue || existing.ExpiresAt <= now)
        {
            return AuthResult.Fail(AuthFailureReason.InvalidCredentials);
        }

        if (!existing.User.IsActive)
        {
            return AuthResult.Fail(AuthFailureReason.AccountInactive);
        }

        existing.RevokedAt = now;

        var result = IssueTokens(existing.User, ipAddress, userAgent);
        await _db.SaveChangesAsync(ct);
        return result;
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var tokenHash = Hash(refreshToken);
        var existing = await _db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == tokenHash, ct);
        if (existing is null || existing.RevokedAt.HasValue)
        {
            return;
        }

        existing.RevokedAt = DateTimeOffset.UtcNow;
        await WriteAuditAsync(existing.UserId, null, "LOGOUT", null, null, ct);
        await _db.SaveChangesAsync(ct);
    }

    private AuthResult IssueTokens(User user, string? ipAddress, string? userAgent)
    {
        var access = _jwtTokenService.GenerateAccessToken(user.UserId, user.Username, user.FullName, user.Role.Code);

        var rawRefreshToken = GenerateRefreshTokenValue();
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtOptions.RefreshTokenDays);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.UserId,
            TokenHash = Hash(rawRefreshToken),
            ExpiresAt = refreshExpiresAt,
            CreatedIp = ipAddress,
            UserAgent = userAgent,
        });

        var authenticatedUser = new AuthenticatedUser(
            user.UserId,
            user.Username,
            user.FullName,
            user.Email,
            user.Role.Code,
            user.Role.Name,
            user.MustChangePassword);

        return AuthResult.Ok(access.Token, access.ExpiresAt, rawRefreshToken, refreshExpiresAt, authenticatedUser);
    }

    private Task WriteAuditAsync(int? userId, string? username, string action, string? ipAddress, string? userAgent, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = username,
            Action = action,
            IpAddress = ipAddress,
            UserAgent = userAgent,
        });
        return Task.CompletedTask;
    }

    private static string GenerateRefreshTokenValue() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
