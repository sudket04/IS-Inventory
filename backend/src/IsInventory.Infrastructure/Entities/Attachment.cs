using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class Attachment
{
    public int AttachmentId { get; set; }

    public int? AssetId { get; set; }

    public string OriginalFileName { get; set; } = null!;

    public string StoredFileName { get; set; } = null!;

    public string StoragePath { get; set; } = null!;

    public string MimeType { get; set; } = null!;

    public int FileSizeBytes { get; set; }

    public string FileHash { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset UploadedAt { get; set; }

    public int? UploadedBy { get; set; }

    public int? ContractId { get; set; }

    public virtual Asset? Asset { get; set; }

    public virtual Contract? Contract { get; set; }

    public virtual User? UploadedByNavigation { get; set; }
}
