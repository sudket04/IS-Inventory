using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class SoftwareInstallation
{
    public int InstallationId { get; set; }

    public int SoftwareAssetId { get; set; }

    public int TargetAssetId { get; set; }

    public DateOnly? InstalledDate { get; set; }

    public string? InstalledVersion { get; set; }

    public DateOnly? RemovedDate { get; set; }

    public bool? IsActive { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? RemovedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual User? RemovedByNavigation { get; set; }

    public virtual Asset SoftwareAsset { get; set; } = null!;

    public virtual Asset TargetAsset { get; set; } = null!;
}
