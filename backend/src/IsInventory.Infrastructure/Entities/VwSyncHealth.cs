using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwSyncHealth
{
    public int JobId { get; set; }

    public string JobCode { get; set; } = null!;

    public string JobName { get; set; } = null!;

    public string JobType { get; set; } = null!;

    public string CronExpression { get; set; } = null!;

    public bool IsEnabled { get; set; }

    public int StaleAfterHours { get; set; }

    public DateTimeOffset? LastSuccessAt { get; set; }

    public DateTimeOffset? LastAttemptAt { get; set; }

    public string? LastRunStatus { get; set; }

    public string? LastErrorMessage { get; set; }

    public int? RecordsCreated { get; set; }

    public int? RecordsUpdated { get; set; }

    public int? RecordsUnchanged { get; set; }

    public int? RecordsVanished { get; set; }

    public int? DurationSeconds { get; set; }

    public int? HoursSinceSuccess { get; set; }

    public string FreshnessStatus { get; set; } = null!;

    public int? ConsecutiveFailures { get; set; }
}
