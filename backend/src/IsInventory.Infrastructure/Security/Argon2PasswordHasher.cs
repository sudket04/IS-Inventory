using System.Security.Cryptography;
using Konscious.Security.Cryptography;
using IsInventory.Domain.Security;

namespace IsInventory.Infrastructure.Security;

/// <summary>
/// Argon2id password hashing (FR-AU-02). Encodes/decodes the standard PHC string
/// format ($argon2id$v=19$m=,t=,p=$salt$hash) so hashes are portable and self-describing —
/// changing the cost parameters later doesn't break verification of existing hashes.
/// </summary>
public sealed class Argon2PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int MemoryKib = 65536; // 64 MiB
    private const int Iterations = 3;
    private const int Parallelism = 2;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = ComputeHash(password, salt, MemoryKib, Iterations, Parallelism);
        return Encode(MemoryKib, Iterations, Parallelism, salt, hash);
    }

    public bool Verify(string password, string hash)
    {
        if (!TryDecode(hash, out var memoryKib, out var iterations, out var parallelism, out var salt, out var expectedHash))
        {
            return false;
        }

        var actualHash = ComputeHash(password, salt, memoryKib, iterations, parallelism);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    private static byte[] ComputeHash(string password, byte[] salt, int memoryKib, int iterations, int parallelism)
    {
        using var argon2 = new Argon2id(System.Text.Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = parallelism,
            MemorySize = memoryKib,
            Iterations = iterations,
        };
        return argon2.GetBytes(HashSize);
    }

    private static string Encode(int memoryKib, int iterations, int parallelism, byte[] salt, byte[] hash) =>
        $"$argon2id$v=19$m={memoryKib},t={iterations},p={parallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";

    private static bool TryDecode(
        string encoded,
        out int memoryKib,
        out int iterations,
        out int parallelism,
        out byte[] salt,
        out byte[] hash)
    {
        memoryKib = iterations = parallelism = 0;
        salt = hash = Array.Empty<byte>();

        var parts = encoded.Split('$', StringSplitOptions.RemoveEmptyEntries);
        // parts: [argon2id, v=19, m=..,t=..,p=.., <salt>, <hash>]
        if (parts.Length != 5 || parts[0] != "argon2id")
        {
            return false;
        }

        var costParts = parts[2].Split(',');
        if (costParts.Length != 3)
        {
            return false;
        }

        try
        {
            memoryKib = int.Parse(costParts[0].Split('=')[1]);
            iterations = int.Parse(costParts[1].Split('=')[1]);
            parallelism = int.Parse(costParts[2].Split('=')[1]);
            salt = Convert.FromBase64String(parts[3]);
            hash = Convert.FromBase64String(parts[4]);
            return true;
        }
        catch (Exception ex) when (ex is FormatException or IndexOutOfRangeException or OverflowException)
        {
            return false;
        }
    }
}
