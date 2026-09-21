using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class FileShare
{
    public int ShareId { get; set; }

    public int AssetId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public int ClassificationId { get; set; }

    public int OwnerDepartmentId { get; set; }

    public int? OwnerUserId { get; set; }

    public string? BusinessPurpose { get; set; }

    public string? FsrmQuotaTemplate { get; set; }

    public bool IsQuotaManaged { get; set; }

    public DateOnly? LastReviewedAt { get; set; }

    public int? LastReviewedBy { get; set; }

    public string? ReviewNote { get; set; }

    public string? Notes { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual FolderClassificationLevel Classification { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<FileSharePermission> FileSharePermissions { get; set; } = new List<FileSharePermission>();

    public virtual ICollection<FileShareUsageSnapshot> FileShareUsageSnapshots { get; set; } = new List<FileShareUsageSnapshot>();

    public virtual User? LastReviewedByNavigation { get; set; }

    public virtual Department OwnerDepartment { get; set; } = null!;

    public virtual User? OwnerUser { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
