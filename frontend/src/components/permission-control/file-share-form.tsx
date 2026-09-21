"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { useClassificationOptions } from "@/lib/permission-control/options";
import { Section, TextField, SelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyFileShareForm, type FileShareDetail, type FileShareForm as FileShareFormState } from "@/lib/permission-control/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string | number) => (v === "" ? null : Number(v));

export function FileShareForm({ existing }: { existing?: FileShareDetail }) {
  const router = useRouter();
  const servers = usePicker("file-servers");
  const classifications = useClassificationOptions();
  const departments = usePicker("departments");
  const users = usePicker("users");

  const [form, setForm] = React.useState<FileShareFormState>(() =>
    existing
      ? {
          assetId: existing.assetId,
          shareName: existing.shareName,
          folderPath: existing.folderPath,
          classificationId: existing.classificationId,
          ownerDepartmentId: existing.ownerDepartmentId,
          ownerUserId: existing.ownerUserId ?? "",
          businessPurpose: existing.businessPurpose ?? "",
          fsrmQuotaTemplate: existing.fsrmQuotaTemplate ?? "",
          isQuotaManaged: existing.isQuotaManaged,
          lastReviewedAt: existing.lastReviewedAt ?? "",
          reviewNote: existing.reviewNote ?? "",
          notes: existing.notes ?? "",
        }
      : emptyFileShareForm
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const readOnly = existing != null && !existing.canEdit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      assetId: Number(form.assetId),
      shareName: form.shareName.trim(),
      folderPath: form.folderPath.trim(),
      classificationId: Number(form.classificationId),
      ownerDepartmentId: Number(form.ownerDepartmentId),
      ownerUserId: num(form.ownerUserId),
      businessPurpose: str(form.businessPurpose),
      fsrmQuotaTemplate: str(form.fsrmQuotaTemplate),
      isQuotaManaged: form.isQuotaManaged,
      lastReviewedAt: form.lastReviewedAt.trim() === "" ? null : form.lastReviewedAt,
      reviewNote: str(form.reviewNote),
      notes: str(form.notes),
    };

    const res = existing
      ? await apiFetch(`/api/file-shares/${existing.shareId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/file-shares", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/file-shares/${saved.shareId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the folder registration.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {readOnly && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Your role can view this classification level but not edit it.
        </p>
      )}
      <Section title="Folder">
        <SelectField id="assetId" label="File Server" required value={String(form.assetId)} onChange={(v) => setForm((f) => ({ ...f, assetId: v === "" ? "" : Number(v) }))} options={servers} placeholder="— Select a Server —" />
        <TextField id="shareName" label="Share Name" required value={form.shareName} onChange={(v) => setForm((f) => ({ ...f, shareName: v }))} />
        <TextField id="folderPath" label="Folder Path (UNC)" required value={form.folderPath} onChange={(v) => setForm((f) => ({ ...f, folderPath: v }))} />
        <SelectField id="classificationId" label="Classification" required value={String(form.classificationId)} onChange={(v) => setForm((f) => ({ ...f, classificationId: v === "" ? "" : Number(v) }))} options={classifications} placeholder="— Select a Level —" />
      </Section>

      <Section title="Ownership">
        <SelectField id="ownerDepartmentId" label="Owning Department" required value={String(form.ownerDepartmentId)} onChange={(v) => setForm((f) => ({ ...f, ownerDepartmentId: v === "" ? "" : Number(v) }))} options={departments} />
        <SelectField id="ownerUserId" label="Owner (individual)" value={String(form.ownerUserId)} onChange={(v) => setForm((f) => ({ ...f, ownerUserId: v === "" ? "" : Number(v) }))} options={users} />
        <div className="col-span-full space-y-1.5">
          <label htmlFor="businessPurpose" className="text-sm font-medium text-text-primary">Business Purpose</label>
          <textarea
            id="businessPurpose"
            value={form.businessPurpose}
            onChange={(e) => setForm((f) => ({ ...f, businessPurpose: e.target.value }))}
            className="h-16 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      <Section title="Quota & Review">
        <TextField id="fsrmQuotaTemplate" label="FSRM Quota Template" value={form.fsrmQuotaTemplate} onChange={(v) => setForm((f) => ({ ...f, fsrmQuotaTemplate: v }))} />
        <CheckboxField id="isQuotaManaged" label="Quota Managed by FSRM" checked={form.isQuotaManaged} onChange={(v) => setForm((f) => ({ ...f, isQuotaManaged: v }))} />
        <TextField id="lastReviewedAt" label="Last Reviewed" type="date" value={form.lastReviewedAt} onChange={(v) => setForm((f) => ({ ...f, lastReviewedAt: v }))} />
        <TextField id="reviewNote" label="Review Note" value={form.reviewNote} onChange={(v) => setForm((f) => ({ ...f, reviewNote: v }))} />
      </Section>

      <Section title="Notes">
        <div className="col-span-full space-y-1.5">
          <textarea
            aria-label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="h-20 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/file-shares")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || readOnly}>
          {submitting ? "Saving…" : existing ? "Save Changes" : "Register Folder"}
        </Button>
      </div>
    </form>
  );
}
