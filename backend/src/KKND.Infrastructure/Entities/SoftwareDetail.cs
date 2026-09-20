using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class SoftwareDetail
{
    public int AssetId { get; set; }

    public string? Publisher { get; set; }

    public string? Version { get; set; }

    public string? Edition { get; set; }

    public string LicenseType { get; set; } = null!;

    public byte[]? LicenseKeyEncrypted { get; set; }

    public bool IsPerDevice { get; set; }

    public string? SupportLevel { get; set; }

    public bool AutoRenew { get; set; }

    public string? LicensePortalUrl { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
