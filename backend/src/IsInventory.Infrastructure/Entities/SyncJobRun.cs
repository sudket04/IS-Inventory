using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class SyncJobRun
{
    public long RunId { get; set; }

    public int JobId { get; set; }

    public int? AgentId { get; set; }

    public DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset? FinishedAt { get; set; }

    public string RunStatus { get; set; } = null!;

    public int RecordsRead { get; set; }

    public int RecordsCreated { get; set; }

    public int RecordsUpdated { get; set; }

    public int RecordsUnchanged { get; set; }

    public int RecordsVanished { get; set; }

    public int RecordsFailed { get; set; }

    public string? ErrorMessage { get; set; }

    public string? ErrorDetailJson { get; set; }

    public string TriggeredBy { get; set; } = null!;

    public int? TriggeredByUser { get; set; }

    public int? DurationSeconds { get; set; }

    public virtual CollectorAgent? Agent { get; set; }

    public virtual SyncJob Job { get; set; } = null!;

    public virtual User? TriggeredByUserNavigation { get; set; }
}
