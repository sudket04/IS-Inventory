using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwServerApplication
{
    public int ApplicationId { get; set; }

    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string ServerName { get; set; } = null!;

    public string? ServerTypeName { get; set; }

    public string ApplicationName { get; set; } = null!;

    public string? PortNumber { get; set; }

    public string? LinkUrl { get; set; }

    public string? InchargeName { get; set; }

    public string? DepartmentName { get; set; }

    public string SiteName { get; set; } = null!;

    public bool IsActive { get; set; }

    public string? Notes { get; set; }
}
