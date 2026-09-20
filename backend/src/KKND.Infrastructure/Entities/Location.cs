using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class Location
{
    public int LocationId { get; set; }

    public int? ParentLocationId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string LocationType { get; set; } = null!;

    public string? Address { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<Cluster> Clusters { get; set; } = new List<Cluster>();

    public virtual ICollection<Location> InverseParentLocation { get; set; } = new List<Location>();

    public virtual Location? ParentLocation { get; set; }

    public virtual ICollection<Rack> Racks { get; set; } = new List<Rack>();
}
