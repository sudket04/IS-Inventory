namespace KKND.Api.Controllers.Attachments;

public sealed record AttachmentListItem(
    int AttachmentId, string OriginalFileName, string MimeType, int FileSizeBytes,
    string? Description, DateTimeOffset UploadedAt, string? UploadedByName);
