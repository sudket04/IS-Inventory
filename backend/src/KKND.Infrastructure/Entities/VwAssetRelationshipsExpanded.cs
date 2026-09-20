using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwAssetRelationshipsExpanded
{
    public int RelationshipId { get; set; }

    public int FromAssetId { get; set; }

    public int ToAssetId { get; set; }

    public string Direction { get; set; } = null!;

    public string RelationshipName { get; set; } = null!;

    public string RelatedAssetTag { get; set; } = null!;

    public string RelatedAssetName { get; set; } = null!;

    public string RelatedStatusCode { get; set; } = null!;

    public string? Notes { get; set; }
}
