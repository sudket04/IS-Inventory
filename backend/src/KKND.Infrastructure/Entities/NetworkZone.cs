using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class NetworkZone
{
    public int ZoneId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public byte TrustLevel { get; set; }

    public string ColorToken { get; set; } = null!;

    public bool IsInternetFacing { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Vlan> Vlans { get; set; } = new List<Vlan>();
}
