using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwServerRolesSummary
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string ServerName { get; set; } = null!;

    public string? Hostname { get; set; }

    public string? ServerTypeName { get; set; }

    public bool? IsVirtual { get; set; }

    public string? PrimaryRole { get; set; }

    public string? PrimaryRoleGroup { get; set; }

    public int? RoleCount { get; set; }

    public string? RoleList { get; set; }

    public int? HasCriticalService { get; set; }
}
