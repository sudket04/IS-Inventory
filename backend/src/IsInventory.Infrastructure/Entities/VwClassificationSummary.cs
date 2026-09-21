using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwClassificationSummary
{
    public int ClassificationId { get; set; }

    public string ClassificationCode { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string ColorToken { get; set; } = null!;

    public int? FolderCount { get; set; }

    public int? DepartmentCount { get; set; }

    public long? TotalUsedBytes { get; set; }
}
