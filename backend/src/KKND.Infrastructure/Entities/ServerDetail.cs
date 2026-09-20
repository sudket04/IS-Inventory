using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class ServerDetail
{
    public int AssetId { get; set; }

    public string? Hostname { get; set; }

    public string? MacAddress { get; set; }

    public string? CpuModel { get; set; }

    public byte? CpuSocketCount { get; set; }

    public short? CpuCoreCount { get; set; }

    public int? RamGb { get; set; }

    public string? OsName { get; set; }

    public string? OsVersion { get; set; }

    public DateOnly? OsInstallDate { get; set; }

    public DateOnly? LastPatchDate { get; set; }

    public int? ParentHostAssetId { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual Asset? ParentHostAsset { get; set; }
}
