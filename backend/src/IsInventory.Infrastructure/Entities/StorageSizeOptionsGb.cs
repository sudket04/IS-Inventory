using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class StorageSizeOptionsGb
{
    public int StorageSizeGbId { get; set; }

    public int SizeGb { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }
}
