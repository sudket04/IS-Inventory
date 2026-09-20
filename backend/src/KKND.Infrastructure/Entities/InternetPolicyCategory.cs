using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class InternetPolicyCategory
{
    public int PolicyCategoryId { get; set; }

    public int PolicyId { get; set; }

    public int CategoryId { get; set; }

    public string PolicyAction { get; set; } = null!;

    public string? Notes { get; set; }

    public virtual WebCategory Category { get; set; } = null!;

    public virtual InternetPolicy Policy { get; set; } = null!;
}
