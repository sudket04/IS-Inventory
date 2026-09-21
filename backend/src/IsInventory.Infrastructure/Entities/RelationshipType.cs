using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class RelationshipType
{
    public int RelationshipTypeId { get; set; }

    public string Code { get; set; } = null!;

    public string ForwardName { get; set; } = null!;

    public string InverseName { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<AssetRelationship> AssetRelationships { get; set; } = new List<AssetRelationship>();
}
