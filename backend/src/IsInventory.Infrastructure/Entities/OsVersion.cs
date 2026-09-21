using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class OsVersion
{
    public int OsVersionId { get; set; }

    public int OsTypeId { get; set; }

    public string Name { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual OsType OsType { get; set; } = null!;

    public virtual ICollection<ServerDetail> ServerDetails { get; set; } = new List<ServerDetail>();
}
