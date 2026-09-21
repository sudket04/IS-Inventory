namespace KKND.Api.Controllers.AuditLogs;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public sealed record AuditLogListItem(
    long AuditId, DateTimeOffset OccurredAt, int? UserId, string? UsernameSnapshot,
    string Action, string? EntityType, int? EntityId, string? EntityLabel,
    string? ChangedFields, string? IpAddress);

public sealed record AuditLogDetail(
    long AuditId, DateTimeOffset OccurredAt, int? UserId, string? UsernameSnapshot,
    string Action, string? EntityType, int? EntityId, string? EntityLabel,
    string? BeforeJson, string? AfterJson, string? ChangedFields,
    string? IpAddress, string? UserAgent, Guid? BatchUid);
