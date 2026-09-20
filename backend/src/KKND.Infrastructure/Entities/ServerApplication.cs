using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class ServerApplication
{
    public int ApplicationId { get; set; }

    public int AssetId { get; set; }

    public int? ServerTypeId { get; set; }

    public string ApplicationName { get; set; } = null!;

    public string? PortNumber { get; set; }

    public string? LinkUrl { get; set; }

    public string? InchargeName { get; set; }

    public int? DepartmentId { get; set; }

    public byte SiteId { get; set; }

    public bool IsActive { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Department? Department { get; set; }

    public virtual ServerRole? ServerType { get; set; }

    public virtual VlanSite Site { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }
}
