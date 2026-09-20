using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class ServerRoleAssignment
{
    public int AssignmentId { get; set; }

    public int AssetId { get; set; }

    public int ServerRoleId { get; set; }

    public bool IsPrimary { get; set; }

    public string? ServiceName { get; set; }

    public string? ServicePort { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ServerRole ServerRole { get; set; } = null!;
}
