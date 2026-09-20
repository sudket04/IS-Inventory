using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class InternetPolicy
{
    public int PolicyId { get; set; }

    public string PolicyCode { get; set; } = null!;

    public string PolicyName { get; set; } = null!;

    public string? Description { get; set; }

    public int? ProxyAssetId { get; set; }

    public string? ExternalPolicyRef { get; set; }

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; }

    public string? Notes { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<InternetPolicyCategory> InternetPolicyCategories { get; set; } = new List<InternetPolicyCategory>();

    public virtual ICollection<InternetPolicyGroup> InternetPolicyGroups { get; set; } = new List<InternetPolicyGroup>();

    public virtual Asset? ProxyAsset { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
