using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwDepartmentFolderSummary
{
    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = null!;

    public int? FolderCount { get; set; }

    public int? ServerCount { get; set; }

    public long? TotalUsedBytes { get; set; }

    public long? TotalQuotaBytes { get; set; }

    public int? ConfidentialOrAbove { get; set; }

    public int? NearFullCount { get; set; }

    public DateOnly? OldestReviewDate { get; set; }
}
