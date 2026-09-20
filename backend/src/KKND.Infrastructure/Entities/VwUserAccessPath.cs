using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwUserAccessPath
{
    public int AdUserId { get; set; }

    public string SamAccountName { get; set; } = null!;

    public string? UserDisplayName { get; set; }

    public bool IsEnabled { get; set; }

    public int ShareId { get; set; }

    public string ShareName { get; set; } = null!;

    public string FolderPath { get; set; } = null!;

    public string ClassificationCode { get; set; } = null!;

    public string ClassificationName { get; set; } = null!;

    public byte SensitivityRank { get; set; }

    public string AccessLevelCode { get; set; } = null!;

    public string AccessLevelName { get; set; } = null!;

    public byte PrivilegeRank { get; set; }

    public string GrantingGroupName { get; set; } = null!;

    public string MemberOfGroupName { get; set; } = null!;

    public int? NestingDepth { get; set; }

    public string? AccessPath { get; set; }

    public string? AccessRoute { get; set; }
}
