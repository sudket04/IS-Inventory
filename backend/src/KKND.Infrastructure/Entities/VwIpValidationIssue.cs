using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwIpValidationIssue
{
    public long? IpId { get; set; }

    public string? IpAddress { get; set; }

    public int? AssetId { get; set; }

    public string IssueCode { get; set; } = null!;

    public string Severity { get; set; } = null!;

    public string? IssueDetail { get; set; }
}
