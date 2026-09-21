namespace IsInventory.Domain.Auth;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(string username, string password, string? ipAddress, string? userAgent, CancellationToken ct = default);

    Task<AuthResult> RefreshAsync(string refreshToken, string? ipAddress, string? userAgent, CancellationToken ct = default);

    /// <summary>Mints a fresh access+refresh token pair for an already-authenticated user
    /// (e.g. right after they change their own password) without re-checking credentials.</summary>
    Task<AuthResult> ReissueForUserAsync(int userId, string? ipAddress, string? userAgent, CancellationToken ct = default);

    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
