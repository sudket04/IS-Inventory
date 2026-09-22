using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class StorageSizeOptionsTb
{
    public int StorageSizeTbId { get; set; }

    public int SizeTb { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }
}
