using System.Security.Cryptography;
using System.Text;
using KKND.Domain.Security;
using Microsoft.Extensions.Configuration;

namespace KKND.Infrastructure.Security;

/// <summary>
/// AES-256-GCM, single master key from config (Licensing:EncryptionKeyBase64 — 32 raw
/// bytes, base64-encoded). Stored blob layout: 12-byte nonce || ciphertext || 16-byte tag,
/// concatenated so a single VARBINARY(1024) column holds everything needed to decrypt.
/// </summary>
public sealed class AesGcmLicenseKeyProtector : ILicenseKeyProtector
{
    private const int NonceSizeBytes = 12;
    private const int TagSizeBytes = 16;

    private readonly byte[] _key;

    public AesGcmLicenseKeyProtector(IConfiguration configuration)
    {
        var base64Key = configuration["Licensing:EncryptionKeyBase64"];
        if (string.IsNullOrWhiteSpace(base64Key))
        {
            throw new InvalidOperationException(
                "Licensing:EncryptionKeyBase64 is not configured. Set it via " +
                "'dotnet user-secrets set Licensing:EncryptionKeyBase64 \"<base64 of 32 random bytes>\"' locally, " +
                "or an environment variable / Key Vault in production (NFR-07). " +
                "Generate one with: openssl rand -base64 32");
        }

        _key = Convert.FromBase64String(base64Key);
        if (_key.Length != 32)
        {
            throw new InvalidOperationException("Licensing:EncryptionKeyBase64 must decode to exactly 32 bytes (AES-256).");
        }
    }

    public byte[] Encrypt(string plaintext)
    {
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(NonceSizeBytes);
        var cipherBytes = new byte[plaintextBytes.Length];
        var tag = new byte[TagSizeBytes];

        using var aesGcm = new AesGcm(_key, TagSizeBytes);
        aesGcm.Encrypt(nonce, plaintextBytes, cipherBytes, tag);

        var result = new byte[NonceSizeBytes + cipherBytes.Length + TagSizeBytes];
        Buffer.BlockCopy(nonce, 0, result, 0, NonceSizeBytes);
        Buffer.BlockCopy(cipherBytes, 0, result, NonceSizeBytes, cipherBytes.Length);
        Buffer.BlockCopy(tag, 0, result, NonceSizeBytes + cipherBytes.Length, TagSizeBytes);
        return result;
    }

    public string Decrypt(byte[] ciphertext)
    {
        if (ciphertext.Length < NonceSizeBytes + TagSizeBytes)
        {
            throw new ArgumentException("Ciphertext is too short to contain a nonce and tag.", nameof(ciphertext));
        }

        var nonce = ciphertext.AsSpan(0, NonceSizeBytes);
        var tag = ciphertext.AsSpan(ciphertext.Length - TagSizeBytes, TagSizeBytes);
        var cipherBytes = ciphertext.AsSpan(NonceSizeBytes, ciphertext.Length - NonceSizeBytes - TagSizeBytes);
        var plaintextBytes = new byte[cipherBytes.Length];

        using var aesGcm = new AesGcm(_key, TagSizeBytes);
        aesGcm.Decrypt(nonce, cipherBytes, tag, plaintextBytes);

        return Encoding.UTF8.GetString(plaintextBytes);
    }
}
