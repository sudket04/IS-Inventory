using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwPermissionRecentVersion
{
    public int PermissionId { get; set; }

    public long? VersionNo { get; set; }

    public long? VersionSeq { get; set; }

    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string AdGroupName { get; set; } = null!;

    public string AccessLevelCode { get; set; } = null!;

    public string AccessLevelName { get; set; } = null!;

    public string? PreviousAccessLevelName { get; set; }

    public bool IsDeleted { get; set; }

    public string? GrantedReason { get; set; }

    public string ChangeAction { get; set; } = null!;

    public string ChangeActionTh { get; set; } = null!;

    public int? ChangedByUserId { get; set; }

    public string? ChangedByUsername { get; set; }

    public string? ChangedByName { get; set; }

    public DateTime ChangedAtUtc { get; set; }

    public DateTime SupersededAtUtc { get; set; }

    public int IsCurrent { get; set; }
}
