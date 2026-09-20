namespace KKND.Domain.Security;

public interface IJwtTokenService
{
    JwtAccessToken GenerateAccessToken(int userId, string username, string fullName, string roleCode);
}

public sealed record JwtAccessToken(string Token, DateTimeOffset ExpiresAt);
