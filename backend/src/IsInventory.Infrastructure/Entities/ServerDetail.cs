using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ServerDetail
{
    public int AssetId { get; set; }

    public string? Hostname { get; set; }

    public string? MacAddress { get; set; }

    public DateOnly? OsInstallDate { get; set; }

    public DateOnly? LastPatchDate { get; set; }

    public int? ClusterId { get; set; }

    public string? SystemGroup { get; set; }

    public string? Fqdn { get; set; }

    public int? ServerZoneId { get; set; }

    public string? Environment { get; set; }

    public string? Criticality { get; set; }

    public int? ServerStatusId { get; set; }

    public int? OsTypeId { get; set; }

    public int? OsVersionId { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual Cluster? Cluster { get; set; }

    public virtual OsType? OsType { get; set; }

    public virtual OsVersion? OsVersion { get; set; }

    public virtual ServerStatus? ServerStatus { get; set; }

    public virtual NetworkZone? ServerZone { get; set; }
}
