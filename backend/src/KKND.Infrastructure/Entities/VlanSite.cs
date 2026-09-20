using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VlanSite
{
    public byte SiteId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ServerApplication> ServerApplications { get; set; } = new List<ServerApplication>();

    public virtual ICollection<Vlan> Vlans { get; set; } = new List<Vlan>();
}
