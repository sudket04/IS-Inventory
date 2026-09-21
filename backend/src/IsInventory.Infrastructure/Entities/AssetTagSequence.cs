using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class AssetTagSequence
{
    public int CategoryId { get; set; }

    public short Year { get; set; }

    public int LastNumber { get; set; }

    public virtual AssetCategory Category { get; set; } = null!;
}
