using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwLocationTree
{
    public int? LocationId { get; set; }

    public int? ParentLocationId { get; set; }

    public string? Code { get; set; }

    public string? Name { get; set; }

    public string? LocationType { get; set; }

    public bool? IsActive { get; set; }

    public string? FullPath { get; set; }

    public int? Depth { get; set; }
}
