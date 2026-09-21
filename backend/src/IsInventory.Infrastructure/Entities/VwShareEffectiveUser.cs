using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwShareEffectiveUser
{
    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string OwnerDepartment { get; set; } = null!;

    public int? TotalUsers { get; set; }

    public int? ReadWriteUsers { get; set; }

    public int? ReadOnlyUsers { get; set; }

    public int? DisabledUsers { get; set; }
}
