using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AccessLevel
{
    public int AccessLevelId { get; set; }

    public string Code { get; set; } = null!;

    public string NameTh { get; set; } = null!;

    public string NameEn { get; set; } = null!;

    public bool CanWrite { get; set; }

    public byte PrivilegeRank { get; set; }

    public string ColorToken { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<FileSharePermission> FileSharePermissions { get; set; } = new List<FileSharePermission>();
}
