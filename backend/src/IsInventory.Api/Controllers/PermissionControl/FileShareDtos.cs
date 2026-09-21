namespace IsInventory.Api.Controllers.PermissionControl;

public sealed record FileShareListItem(
    int ShareId, string ShareName, string FolderPath, string AssetTag, string ServerName,
    string ClassificationCode, string ClassificationName, byte SensitivityRank, string ClassificationColor,
    string OwnerDepartment, string? OwnerUserName, int? TotalGroupCount, int? OrphanGroupCount,
    DateOnly? LastReviewedAt, int? DaysSinceReview);

public sealed record FileShareDetail(
    int ShareId, int AssetId, string AssetTag, string ServerName, string ShareName, string FolderPath,
    int ClassificationId, string ClassificationCode, string ClassificationName, byte SensitivityRank, string ClassificationColor,
    int OwnerDepartmentId, string OwnerDepartment, int? OwnerUserId, string? OwnerUserName,
    string? BusinessPurpose, string? FsrmQuotaTemplate, bool IsQuotaManaged,
    DateOnly? LastReviewedAt, int? LastReviewedBy, string? ReviewNote, string? Notes, bool CanEdit);

public sealed record FileShareRequest(
    int AssetId, string ShareName, string FolderPath, int ClassificationId, int OwnerDepartmentId,
    int? OwnerUserId, string? BusinessPurpose, string? FsrmQuotaTemplate, bool IsQuotaManaged,
    DateOnly? LastReviewedAt, string? ReviewNote, string? Notes);

public sealed record FileSharePermissionItem(
    int PermissionId, int? AdGroupId, string AdGroupName, string AccessLevelCode, string AccessLevelName,
    string ColorToken, string? GrantedReason, string? RequestReference, bool IsOrphanGroup);

public sealed record FileSharePermissionRequest(
    int? AdGroupId, string AdGroupNameRaw, int AccessLevelId, string? GrantedReason, string? RequestReference);

public sealed record PermissionVersionItem(
    long? VersionNo, string AdGroupName, string AccessLevelName, string? PreviousAccessLevelName,
    string ChangeAction, string ChangeActionTh, string? ChangedByName, DateTime ChangedAtUtc, int IsCurrent);
