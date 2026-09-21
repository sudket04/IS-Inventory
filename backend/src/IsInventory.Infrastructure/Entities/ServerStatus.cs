using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ServerStatus
{
    public int ServerStatusId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string ColorToken { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ServerDetail> ServerDetails { get; set; } = new List<ServerDetail>();
}
