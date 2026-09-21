export interface AttachmentListItem {
  attachmentId: number;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description: string | null;
  uploadedAt: string;
  uploadedByName: string | null;
}
