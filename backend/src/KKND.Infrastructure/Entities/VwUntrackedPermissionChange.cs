using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwUntrackedPermissionChange
{
    public int PermissionId { get; set; }

    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string AdGroupName { get; set; } = null!;

    public string ChangeAction { get; set; } = null!;

    public string ChangeActionTh { get; set; } = null!;

    public DateTime ChangedAtUtc { get; set; }

    public int? ChangedByUserId { get; set; }

    public string? ChangedByName { get; set; }

    public string IssueDetail { get; set; } = null!;
}
