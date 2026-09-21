namespace IsInventory.Domain.Security;

/// <summary>
/// Encrypts/decrypts software_details.license_key_encrypted (FR-SW-06). Application-side
/// encryption because the schema stores it as opaque VARBINARY(1024) — SQL Server never
/// sees the plaintext.
/// </summary>
public interface ILicenseKeyProtector
{
    byte[] Encrypt(string plaintext);

    string Decrypt(byte[] ciphertext);
}
