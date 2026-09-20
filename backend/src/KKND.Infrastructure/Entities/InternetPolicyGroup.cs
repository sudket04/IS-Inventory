using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class InternetPolicyGroup
{
    public int PolicyGroupId { get; set; }

    public int PolicyId { get; set; }

    public int? AdGroupId { get; set; }

    public string AdGroupNameRaw { get; set; } = null!;

    public string? Notes { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual AdGroup? AdGroup { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual InternetPolicy Policy { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }
}
