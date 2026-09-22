using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class CpuCoreOption
{
    public int CpuCoreOptionId { get; set; }

    public short CoreCount { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }
}
