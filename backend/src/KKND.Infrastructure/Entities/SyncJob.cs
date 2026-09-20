using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class SyncJob
{
    public int JobId { get; set; }

    public string JobCode { get; set; } = null!;

    public string JobName { get; set; } = null!;

    public string JobType { get; set; } = null!;

    public string CronExpression { get; set; } = null!;

    public int TimeoutSeconds { get; set; }

    public int StaleAfterHours { get; set; }

    public bool IsEnabled { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<SyncJobRun> SyncJobRuns { get; set; } = new List<SyncJobRun>();

    public virtual User? UpdatedByNavigation { get; set; }
}
