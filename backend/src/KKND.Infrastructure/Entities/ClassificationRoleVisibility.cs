using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class ClassificationRoleVisibility
{
    public int ClassificationId { get; set; }

    public int RoleId { get; set; }

    public bool CanView { get; set; }

    public bool CanEdit { get; set; }

    public bool CanExport { get; set; }

    public virtual FolderClassificationLevel Classification { get; set; } = null!;

    public virtual Role Role { get; set; } = null!;
}
