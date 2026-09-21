using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class AdGroup
{
    public int AdGroupId { get; set; }

    public Guid ObjectGuid { get; set; }

    public string? ObjectSid { get; set; }

    public string SamAccountName { get; set; } = null!;

    public string? DisplayName { get; set; }

    public string DistinguishedName { get; set; } = null!;

    public string? OuPath { get; set; }

    public string? Description { get; set; }

    public string? GroupScope { get; set; }

    public string? GroupCategory { get; set; }

    public string? ManagedByDn { get; set; }

    public int DirectMemberCount { get; set; }

    public bool IsPresentInAd { get; set; }

    public DateTimeOffset FirstSeenAt { get; set; }

    public DateTimeOffset? DisappearedAt { get; set; }

    public virtual ICollection<AdGroupMember> AdGroupMemberAdGroups { get; set; } = new List<AdGroupMember>();

    public virtual ICollection<AdGroupMember> AdGroupMemberMemberGroups { get; set; } = new List<AdGroupMember>();

    public virtual ICollection<FileSharePermission> FileSharePermissions { get; set; } = new List<FileSharePermission>();

    public virtual ICollection<InternetPolicyGroup> InternetPolicyGroups { get; set; } = new List<InternetPolicyGroup>();
}
