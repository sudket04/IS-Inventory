using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class CollectorAgent
{
    public int AgentId { get; set; }

    public string AgentCode { get; set; } = null!;

    public string AgentName { get; set; } = null!;

    public string? Description { get; set; }

    public string ApiKeyHash { get; set; } = null!;

    public string ApiKeyPrefix { get; set; } = null!;

    public string? AllowedSourceIps { get; set; }

    public string? AgentVersion { get; set; }

    public string? Hostname { get; set; }

    public DateTimeOffset? LastHeartbeatAt { get; set; }

    public DateTimeOffset? ApiKeyExpiresAt { get; set; }

    public bool IsEnabled { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<SyncJobRun> SyncJobRuns { get; set; } = new List<SyncJobRun>();
}
