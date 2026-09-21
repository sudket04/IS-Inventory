"use client";

import * as React from "react";
import { Paperclip, Download, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { Section } from "@/components/assets/form-fields";
import { formatDateTime } from "@/lib/format";
import type { AttachmentListItem } from "@/lib/attachments/types";

const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".docx"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsPanel({ assetId }: { assetId: number }) {
  const { user } = useAuth();
  const canManage = user?.roleCode === "ADMIN" || user?.roleCode === "IT_STAFF";

  const [items, setItems] = React.useState<AttachmentListItem[] | null>(null);
  const [description, setDescription] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/assets/${assetId}/attachments`);
    if (res.ok) setItems(await res.json());
  }, [assetId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("File type not allowed. Accepted: PDF, JPG, PNG, XLSX, DOCX.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds the 10 MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (description.trim()) formData.append("description", description.trim());

    setUploading(true);
    const res = await apiFetch(`/api/assets/${assetId}/attachments`, { method: "POST", body: formData });
    setUploading(false);

    if (res.ok) {
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not upload the file.");
    }
  }

  async function handleDownload(item: AttachmentListItem) {
    const res = await apiFetch(`/api/attachments/${item.attachmentId}/download`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.originalFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(item: AttachmentListItem) {
    if (!window.confirm(`Delete "${item.originalFileName}"?`)) return;
    await apiFetch(`/api/attachments/${item.attachmentId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Attachments">
      {canManage && (
        <form onSubmit={handleUpload} className="mb-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <label className="text-sm text-text-secondary" htmlFor="attachment-file">File</label>
            <input
              id="attachment-file"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="block text-sm text-text-primary file:mr-2 file:rounded-md file:border file:border-border-default file:bg-bg-surface file:px-2 file:py-1 file:text-sm"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm text-text-secondary" htmlFor="attachment-description">Description (optional)</label>
            <input
              id="attachment-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
            />
          </div>
          <Button type="submit" size="sm" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </form>
      )}
      {canManage && <p className="mb-3 text-xs text-text-tertiary">PDF, JPG, PNG, XLSX, DOCX · max 10 MB</p>}
      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!items ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-tertiary">No files attached.</p>
      ) : (
        <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
          {items.map((item) => (
            <li key={item.attachmentId} className="flex items-center gap-3 bg-bg-surface px-3 py-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-text-primary">{item.originalFileName}</p>
                <p className="text-xs text-text-tertiary">
                  {formatFileSize(item.fileSizeBytes)} · {item.uploadedByName ?? "—"} · {formatDateTime(item.uploadedAt)}
                  {item.description ? ` · ${item.description}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Download" onClick={() => handleDownload(item)}>
                <Download className="size-4" />
              </Button>
              {canManage && (
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(item)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
