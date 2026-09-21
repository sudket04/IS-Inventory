using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class UserMenuPermission
{
    public int UserId { get; set; }

    public int MenuId { get; set; }

    public bool? CanView { get; set; }

    public bool? CanCreate { get; set; }

    public bool? CanEdit { get; set; }

    public bool? CanDelete { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Menu Menu { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual User User { get; set; } = null!;
}
