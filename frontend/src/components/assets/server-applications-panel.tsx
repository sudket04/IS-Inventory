"use client";

import * as React from "react";
import { AppWindow, Pencil, Trash2, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/lib/auth/auth-context";
import { Section } from "@/components/assets/form-fields";
import { usePicker } from "@/lib/assets/options";
import {
  emptyServerApplicationForm,
  type ServerApplicationForm,
  type ServerApplicationListItem,
} from "@/lib/server-applications/types";

export function ServerApplicationsPanel({ assetId }: { assetId: number }) {
  // Matches backend ServerApplicationsController's [RequiresPermission("server_list", ...)] —
  // this panel is embedded on both Server List and Asset edit pages, but the write permission
  // is always governed by the Server List menu regardless of which page hosts it.
  const perm = usePermission("server_list");

  const serverTypes = usePicker("server-roles");
  const departments = usePicker("departments");
  const sites = usePicker("vlan-sites");

  const [items, setItems] = React.useState<ServerApplicationListItem[] | null>(null);
  const [editing, setEditing] = React.useState<ServerApplicationListItem | "new" | null>(null);
  const [form, setForm] = React.useState<ServerApplicationForm>(emptyServerApplicationForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/assets/${assetId}/applications`);
    if (res.ok) setItems(await res.json());
  }, [assetId]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(emptyServerApplicationForm);
    setError(null);
    setEditing("new");
  }

  function openEdit(item: ServerApplicationListItem) {
    setForm({
      serverTypeId: item.serverTypeId ? String(item.serverTypeId) : "",
      applicationName: item.applicationName,
      portNumber: item.portNumber ?? "",
      linkUrl: item.linkUrl ?? "",
      inchargeName: item.inchargeName ?? "",
      departmentId: item.departmentId ? String(item.departmentId) : "",
      siteId: String(item.siteId),
      isActive: item.isActive,
      notes: item.notes ?? "",
    });
    setError(null);
    setEditing(item);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      serverTypeId: form.serverTypeId ? Number(form.serverTypeId) : null,
      applicationName: form.applicationName.trim(),
      portNumber: form.portNumber.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      inchargeName: form.inchargeName.trim() || null,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      siteId: Number(form.siteId),
      isActive: form.isActive,
      notes: form.notes.trim() || null,
    };

    const res = editing === "new"
      ? await apiFetch(`/api/assets/${assetId}/applications`, { method: "POST", body: JSON.stringify(body) })
      : await apiFetch(`/api/applications/${(editing as ServerApplicationListItem).applicationId}`, { method: "PUT", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      setEditing(null);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the application.");
    }
  }

  async function handleDelete(item: ServerApplicationListItem) {
    if (!window.confirm(`Remove "${item.applicationName}"?`)) return;
    await apiFetch(`/api/applications/${item.applicationId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Applications">
      {perm.canCreate && (
        <div className="mb-3">
          <Button type="button" size="sm" onClick={openNew}>+ Add Application</Button>
        </div>
      )}

      {!items ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-tertiary">No applications registered on this server.</p>
      ) : (
        <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
          {items.map((item) => (
            <li key={item.applicationId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
              <AppWindow className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary">
                  {item.applicationName}
                  {!item.isActive && <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Inactive</span>}
                  {item.linkUrl && (
                    <a href={item.linkUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-xs text-accent-text hover:underline">
                      Open <ExternalLink className="size-3" />
                    </a>
                  )}
                </p>
                <p className="text-xs text-text-tertiary">
                  {item.serverTypeName ?? "—"} · Port {item.portNumber ?? "—"} · {item.siteName}
                  {item.inchargeName ? ` · ${item.inchargeName}` : ""}
                  {item.departmentName ? ` · ${item.departmentName}` : ""}
                </p>
                {item.notes && <p className="mt-0.5 text-xs text-text-tertiary">{item.notes}</p>}
              </div>
              {(perm.canEdit || perm.canDelete) && (
                <div className="flex shrink-0 gap-1">
                  {perm.canEdit && (
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  {perm.canDelete && (
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(item)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">
              {editing === "new" ? "Add Application" : "Edit Application"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" required value={form.applicationName} onChange={(e) => setForm((f) => ({ ...f, applicationName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="app-type">Server Type</Label>
                  <select id="app-type" value={form.serverTypeId} onChange={(e) => setForm((f) => ({ ...f, serverTypeId: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary">
                    <option value="">— None —</option>
                    {serverTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-port">Port</Label>
                  <Input id="app-port" placeholder="80,443" value={form.portNumber} onChange={(e) => setForm((f) => ({ ...f, portNumber: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-link">Link URL</Label>
                <Input id="app-link" type="url" placeholder="https://…" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="app-incharge">In Charge</Label>
                  <Input id="app-incharge" value={form.inchargeName} onChange={(e) => setForm((f) => ({ ...f, inchargeName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-dept">Department</Label>
                  <select id="app-dept" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary">
                    <option value="">— None —</option>
                    {departments.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="app-site">Site</Label>
                  <select id="app-site" required value={form.siteId} onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary">
                    <option value="" disabled>Select…</option>
                    {sites.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="size-4 rounded border-border-strong" />
                  Active
                </label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-notes">Notes</Label>
                <textarea id="app-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="h-16 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary" />
              </div>

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
