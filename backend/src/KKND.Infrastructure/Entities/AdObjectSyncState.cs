using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class AdObjectSyncState
{
    public Guid ObjectGuid { get; set; }

    public string ObjectType { get; set; } = null!;

    public DateTimeOffset LastSeenAt { get; set; }

    public long? LastRunId { get; set; }
}
