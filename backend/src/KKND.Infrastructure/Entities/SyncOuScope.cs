using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class SyncOuScope
{
    public int ScopeId { get; set; }

    public string DistinguishedName { get; set; } = null!;

    public byte[]? DnHash { get; set; }

    public string ScopeLabel { get; set; } = null!;

    public string ObjectTypes { get; set; } = null!;

    public bool IncludeSubtree { get; set; }

    public string? LdapFilter { get; set; }

    public bool IsEnabled { get; set; }

    public string? Notes { get; set; }
}
