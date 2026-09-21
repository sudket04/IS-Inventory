using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class FolderClassificationLevel
{
    public int ClassificationId { get; set; }

    public string Code { get; set; } = null!;

    public string NameTh { get; set; } = null!;

    public string NameEn { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string ColorToken { get; set; } = null!;

    public bool RequiresViewAudit { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ClassificationRoleVisibility> ClassificationRoleVisibilities { get; set; } = new List<ClassificationRoleVisibility>();

    public virtual ICollection<FileShare> FileShares { get; set; } = new List<FileShare>();
}
