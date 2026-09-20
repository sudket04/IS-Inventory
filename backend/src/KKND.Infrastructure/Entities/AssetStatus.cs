using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AssetStatus
{
    public int StatusId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string ColorToken { get; set; } = null!;

    public bool IsOperational { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
