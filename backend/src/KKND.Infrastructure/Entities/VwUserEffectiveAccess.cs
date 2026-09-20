using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwUserEffectiveAccess
{
    public int AdUserId { get; set; }

    public string SamAccountName { get; set; } = null!;

    public string? UserDisplayName { get; set; }

    public bool IsEnabled { get; set; }

    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationCode { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public byte? EffectivePrivilegeRank { get; set; }

    public int? PathCount { get; set; }

    public int? ShortestDepth { get; set; }
}
