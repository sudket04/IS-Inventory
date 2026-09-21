using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwPermissionIssue
{
    public string IssueCode { get; set; } = null!;

    public string Severity { get; set; } = null!;

    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string? Subject { get; set; }

    public string IssueDetail { get; set; } = null!;
}
