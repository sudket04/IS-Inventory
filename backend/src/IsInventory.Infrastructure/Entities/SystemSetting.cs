using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class SystemSetting
{
    public string SettingKey { get; set; } = null!;

    public string? SettingValue { get; set; }

    public string ValueType { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsSecret { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
