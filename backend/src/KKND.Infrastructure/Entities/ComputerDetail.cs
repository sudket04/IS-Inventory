using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class ComputerDetail
{
    public int AssetId { get; set; }

    public string? Hostname { get; set; }

    public string? MacAddress { get; set; }

    public string? CpuModel { get; set; }

    public int? RamGb { get; set; }

    public string? StorageConfig { get; set; }

    public string? OsName { get; set; }

    public string? OsVersion { get; set; }

    public DateOnly? AssignedDate { get; set; }

    public string? AssignedToName { get; set; }

    public bool? DomainJoined { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
