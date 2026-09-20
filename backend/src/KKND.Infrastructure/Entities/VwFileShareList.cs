using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwFileShareList
{
    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string? BusinessPurpose { get; set; }

    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string ServerName { get; set; } = null!;

    public int ClassificationId { get; set; }

    public string ClassificationCode { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string ClassificationColor { get; set; } = null!;

    public bool RequiresViewAudit { get; set; }

    public int DepartmentId { get; set; }

    public string OwnerDepartment { get; set; } = null!;

    public string? OwnerUserName { get; set; }

    public DateTimeOffset? UsageMeasuredAt { get; set; }

    public long? QuotaBytes { get; set; }

    public long? UsedBytes { get; set; }

    public decimal? UsagePercent { get; set; }

    public string? UsageStatus { get; set; }

    public int? RwGroupCount { get; set; }

    public int? RoGroupCount { get; set; }

    public int? TotalGroupCount { get; set; }

    public int? OrphanGroupCount { get; set; }

    public DateOnly? LastReviewedAt { get; set; }

    public int? DaysSinceReview { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }
}
