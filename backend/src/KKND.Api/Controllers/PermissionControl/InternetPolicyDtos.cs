namespace KKND.Api.Controllers.PermissionControl;

public sealed record InternetPolicyListItem(
    int PolicyId, string PolicyCode, string PolicyName, bool IsDefault, bool IsActive, int GroupCount, int CategoryCount);

public sealed record InternetPolicyDetail(
    int PolicyId, string PolicyCode, string PolicyName, string? Description,
    string? ExternalPolicyRef, bool IsDefault, bool IsActive, string? Notes);

public sealed record InternetPolicyRequest(
    string PolicyCode, string PolicyName, string? Description, string? ExternalPolicyRef,
    bool IsDefault, bool IsActive, string? Notes);

public sealed record PolicyGroupItem(int PolicyGroupId, int? AdGroupId, string AdGroupName, string? Notes);

public sealed record PolicyGroupRequest(int? AdGroupId, string AdGroupNameRaw, string? Notes);

public sealed record PolicyCategoryItem(int PolicyCategoryId, int CategoryId, string CategoryNameEn, string PolicyAction, string? Notes);

public sealed record PolicyCategoryRequest(int CategoryId, string PolicyAction, string? Notes);
