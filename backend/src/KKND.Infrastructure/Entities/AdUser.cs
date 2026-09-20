using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AdUser
{
    public int AdUserId { get; set; }

    public Guid ObjectGuid { get; set; }

    public string? ObjectSid { get; set; }

    public string SamAccountName { get; set; } = null!;

    public string? UserPrincipalName { get; set; }

    public string? DisplayName { get; set; }

    public string? Email { get; set; }

    public string? EmployeeId { get; set; }

    public string? JobTitle { get; set; }

    public string? DepartmentNameRaw { get; set; }

    public int? DepartmentId { get; set; }

    public string DistinguishedName { get; set; } = null!;

    public string? OuPath { get; set; }

    public string? PrimaryGroupSid { get; set; }

    public bool IsEnabled { get; set; }

    public DateTimeOffset? AccountExpiresAt { get; set; }

    public DateTimeOffset? LastLogonAt { get; set; }

    public DateTimeOffset? PasswordLastSetAt { get; set; }

    public bool IsPresentInAd { get; set; }

    public DateTimeOffset FirstSeenAt { get; set; }

    public DateTimeOffset? DisappearedAt { get; set; }

    public int? LinkedUserId { get; set; }

    public virtual ICollection<AdGroupMember> AdGroupMembers { get; set; } = new List<AdGroupMember>();

    public virtual Department? Department { get; set; }

    public virtual User? LinkedUser { get; set; }
}
