using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class ServerRole
{
    public int ServerRoleId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string RoleGroup { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsDhcpProvider { get; set; }

    public bool IsCriticalService { get; set; }

    public string? IconName { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ServerApplication> ServerApplications { get; set; } = new List<ServerApplication>();

    public virtual ICollection<ServerRoleAssignment> ServerRoleAssignments { get; set; } = new List<ServerRoleAssignment>();
}
