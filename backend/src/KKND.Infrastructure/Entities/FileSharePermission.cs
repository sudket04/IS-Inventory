using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class FileSharePermission
{
    public int PermissionId { get; set; }

    public int ShareId { get; set; }

    public int? AdGroupId { get; set; }

    public string AdGroupNameRaw { get; set; } = null!;

    public int AccessLevelId { get; set; }

    public string? GrantedReason { get; set; }

    public string? RequestReference { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual AccessLevel AccessLevel { get; set; } = null!;

    public virtual AdGroup? AdGroup { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual FileShare Share { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }
}
