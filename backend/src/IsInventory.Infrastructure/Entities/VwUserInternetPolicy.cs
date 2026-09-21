using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwUserInternetPolicy
{
    public int AdUserId { get; set; }

    public string SamAccountName { get; set; } = null!;

    public string? UserDisplayName { get; set; }

    public bool IsEnabled { get; set; }

    public int PolicyId { get; set; }

    public string PolicyCode { get; set; } = null!;

    public string PolicyName { get; set; } = null!;

    public string? EnforcedByDevice { get; set; }

    public string GrantingGroupName { get; set; } = null!;

    public int? NestingDepth { get; set; }

    public string? AccessPath { get; set; }
}
