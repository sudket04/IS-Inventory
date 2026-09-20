using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AuditLog
{
    public long AuditId { get; set; }

    public DateTimeOffset OccurredAt { get; set; }

    public int? UserId { get; set; }

    public string? UsernameSnapshot { get; set; }

    public string Action { get; set; } = null!;

    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    public string? EntityLabel { get; set; }

    public string? BeforeJson { get; set; }

    public string? AfterJson { get; set; }

    public string? ChangedFields { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public Guid? BatchUid { get; set; }

    public virtual User? User { get; set; }
}
