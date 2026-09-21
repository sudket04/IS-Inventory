using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAdGroupExpanded
{
    public int? RootGroupId { get; set; }

    public int? NestedGroupId { get; set; }

    public int? Depth { get; set; }

    public string? IdPath { get; set; }

    public string? NamePath { get; set; }
}
