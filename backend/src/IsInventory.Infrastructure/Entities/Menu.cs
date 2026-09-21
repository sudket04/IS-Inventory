using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class Menu
{
    public int MenuId { get; set; }

    public string MenuKey { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int SortOrder { get; set; }

    public virtual ICollection<RoleMenuPermission> RoleMenuPermissions { get; set; } = new List<RoleMenuPermission>();

    public virtual ICollection<UserMenuPermission> UserMenuPermissions { get; set; } = new List<UserMenuPermission>();
}
