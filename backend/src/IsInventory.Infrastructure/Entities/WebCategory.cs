using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class WebCategory
{
    public int CategoryId { get; set; }

    public string Code { get; set; } = null!;

    public string NameTh { get; set; } = null!;

    public string NameEn { get; set; } = null!;

    public byte RiskLevel { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<InternetPolicyCategory> InternetPolicyCategories { get; set; } = new List<InternetPolicyCategory>();
}
