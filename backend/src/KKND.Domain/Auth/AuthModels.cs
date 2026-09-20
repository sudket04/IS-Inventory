namespace KKND.Domain.Auth;

public enum AuthFailureReason
{
    None,
    InvalidCredentials,
    AccountLocked,
    AccountInactive,
}

public sealed class AuthResult
{
    public bool Succeeded { get; init; }

    public AuthFailureReason FailureReason { get; init; } = AuthFailureReason.None;

    /// <summary>Only set when <see cref="FailureReason"/> is <see cref="AuthFailureReason.AccountLocked"/>.</summary>
    public DateTimeOffset? LockedUntil { get; init; }

    public string? AccessToken { get; init; }

    public DateTimeOffset? AccessTokenExpiresAt { get; init; }

    public string? RefreshToken { get; init; }

    public DateTimeOffset? RefreshTokenExpiresAt { get; init; }

    public AuthenticatedUser? User { get; init; }

    public static AuthResult Fail(AuthFailureReason reason, DateTimeOffset? lockedUntil = null) =>
        new() { Succeeded = false, FailureReason = reason, LockedUntil = lockedUntil };

    public static AuthResult Ok(
        string accessToken,
        DateTimeOffset accessTokenExpiresAt,
        string refreshToken,
        DateTimeOffset refreshTokenExpiresAt,
        AuthenticatedUser user) =>
        new()
        {
            Succeeded = true,
            AccessToken = accessToken,
            AccessTokenExpiresAt = accessTokenExpiresAt,
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = refreshTokenExpiresAt,
            User = user,
        };
}

public sealed record AuthenticatedUser(
    int UserId,
    string Username,
    string FullName,
    string Email,
    string RoleCode,
    string RoleName,
    bool MustChangePassword);
