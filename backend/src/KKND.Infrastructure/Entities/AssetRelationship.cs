using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AssetRelationship
{
    public int RelationshipId { get; set; }

    public int SourceAssetId { get; set; }

    public int TargetAssetId { get; set; }

    public int RelationshipTypeId { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual RelationshipType RelationshipType { get; set; } = null!;

    public virtual Asset SourceAsset { get; set; } = null!;

    public virtual Asset TargetAsset { get; set; } = null!;
}
