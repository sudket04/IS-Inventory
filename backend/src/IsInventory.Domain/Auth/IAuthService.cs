namespace IsInventory.Domain.Auth;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(string username, string password, string? ipAddress, string? userAgent, CancellationToken ct = default);

    Task<AuthResult> RefreshAsync(string refreshToken, string? ipAddress, string? userAgent, CancellationToken ct = default);

    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
