using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class RamSizeOption
{
    public int RamSizeOptionId { get; set; }

    public int SizeGb { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }
}
