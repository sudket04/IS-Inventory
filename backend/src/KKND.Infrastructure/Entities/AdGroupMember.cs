using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AdGroupMember
{
    public long MembershipId { get; set; }

    public int AdGroupId { get; set; }

    public int? MemberUserId { get; set; }

    public int? MemberGroupId { get; set; }

    public bool IsPrimaryGroup { get; set; }

    public virtual AdGroup AdGroup { get; set; } = null!;

    public virtual AdGroup? MemberGroup { get; set; }

    public virtual AdUser? MemberUser { get; set; }
}
