using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwVlanValidationIssue
{
    public int VlanId { get; set; }

    public short? VlanNumber { get; set; }

    public string VlanName { get; set; } = null!;

    public string IssueCode { get; set; } = null!;

    public string Severity { get; set; } = null!;

    public string? IssueDetail { get; set; }
}
