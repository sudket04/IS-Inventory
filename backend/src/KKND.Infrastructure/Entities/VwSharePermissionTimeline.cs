using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwSharePermissionTimeline
{
    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public int PermissionId { get; set; }

    public string AdGroupName { get; set; } = null!;

    public string ChangeAction { get; set; } = null!;

    public string ChangeActionTh { get; set; } = null!;

    public string AccessLevelName { get; set; } = null!;

    public string? PreviousAccessLevelName { get; set; }

    public int? ChangedByUserId { get; set; }

    public string? ChangedByUsername { get; set; }

    public string? ChangedByName { get; set; }

    public DateTime ChangedAtUtc { get; set; }

    public long? ChangeSeq { get; set; }
}
