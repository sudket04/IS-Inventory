using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AssetCategory
{
    public int CategoryId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? DetailTable { get; set; }

    public string? IconName { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<AssetTagSequence> AssetTagSequences { get; set; } = new List<AssetTagSequence>();

    public virtual ICollection<AssetType> AssetTypes { get; set; } = new List<AssetType>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<ImportBatch> ImportBatches { get; set; } = new List<ImportBatch>();
}
