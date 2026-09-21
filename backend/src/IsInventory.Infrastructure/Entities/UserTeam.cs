using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class UserTeam
{
    public byte TeamId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int SortOrder { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
