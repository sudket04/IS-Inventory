using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class Role
{
    public int RoleId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsSystem { get; set; }

    public int SortOrder { get; set; }

    public virtual ICollection<ClassificationRoleVisibility> ClassificationRoleVisibilities { get; set; } = new List<ClassificationRoleVisibility>();

    public virtual ICollection<RoleMenuPermission> RoleMenuPermissions { get; set; } = new List<RoleMenuPermission>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
