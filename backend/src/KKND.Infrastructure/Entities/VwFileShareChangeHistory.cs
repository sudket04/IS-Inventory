using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwFileShareChangeHistory
{
    public int ShareId { get; set; }

    public long? VersionNo { get; set; }

    public long? VersionSeq { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public string? PreviousClassificationName { get; set; }

    public string OwnerDepartment { get; set; } = null!;

    public string? PreviousOwnerDepartment { get; set; }

    public string? BusinessPurpose { get; set; }

    public bool IsDeleted { get; set; }

    public string ChangeActionTh { get; set; } = null!;

    public int? ChangedByUserId { get; set; }

    public string? ChangedByUsername { get; set; }

    public string? ChangedByName { get; set; }

    public DateTime ChangedAtUtc { get; set; }

    public DateTime SupersededAtUtc { get; set; }
}
