"use client";

import * as React from "react";
import Link from "next/link";
import { Users, LogOut, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/lib/auth/auth-context";
import { Section, EnumSelectField } from "@/components/assets/form-fields";
import { formatDate } from "@/lib/format";
import { emptyClusterMemberForm, type ClusterMemberForm, type ClusterMemberItem } from "@/lib/clusters/types";

// Mirrors CHECK constraint CK_clmem_role in docs/database/06-module-v1.2.sql §3.
const MEMBER_ROLES = ["HOST", "NODE", "WITNESS", "MANAGER", "PROXY", "REPOSITORY", "GATEWAY", "TAPE_SERVER", "REPLICA"];

export function ClusterMembersPanel({ clusterId }: { clusterId: number }) {
  const perm = usePermission("clusters");

  const [items, setItems] = React.useState<ClusterMemberItem[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<ClusterMemberForm>(emptyClusterMemberForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/clusters/${clusterId}/members`);
    if (res.ok) setItems(await res.json());
  }, [clusterId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await apiFetch(`/api/clusters/${clusterId}/members`, {
      method: "POST",
      body: JSON.stringify({
        assetId: Number(form.assetId),
        memberRole: form.memberRole,
        nodePriority: form.nodePriority ? Number(form.nodePriority) : null,
        joinedDate: null,
        notes: form.notes.trim() || null,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setAdding(false);
      setForm(emptyClusterMemberForm);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not add the member.");
    }
  }

  async function handleLeave(item: ClusterMemberItem) {
    if (!window.confirm(`Mark ${item.assetTag} as having left this cluster? Its history stays on record.`)) return;
    await apiFetch(`/api/cluster-members/${item.memberId}/leave`, { method: "POST" });
    await load();
  }

  async function handleRemove(item: ClusterMemberItem) {
    if (!window.confirm(`Permanently remove this membership record for ${item.assetTag}?`)) return;
    await apiFetch(`/api/cluster-members/${item.memberId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Members">
      {perm.canCreate && (
        <div className="mb-3">
          <Button type="button" size="sm" onClick={() => { setForm(emptyClusterMemberForm); setError(null); setAdding(true); }}>+ Add Member</Button>
        </div>
      )}

      {!items ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-tertiary">No members yet.</p>
      ) : (
        <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
          {items.map((item) => (
            <li key={item.memberId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
              <Users className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary">
                  <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                  <span className="ml-2 text-text-secondary">{item.assetName}</span>
                  {!item.isActive && <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Left {formatDate(item.leftDate)}</span>}
                </p>
                <p className="text-xs text-text-tertiary">
                  {item.memberRole}{item.nodePriority != null ? ` · Priority ${item.nodePriority}` : ""}{item.joinedDate ? ` · Joined ${formatDate(item.joinedDate)}` : ""}
                </p>
                {item.notes && <p className="mt-0.5 text-xs text-text-tertiary">{item.notes}</p>}
              </div>
              {perm.canDelete && (
                <div className="flex shrink-0 gap-1">
                  {item.isActive && (
                    <Button variant="ghost" size="icon" aria-label="Mark as left" onClick={() => handleLeave(item)}>
                      <LogOut className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => handleRemove(item)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">Add Member</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mem-asset">Asset ID</Label>
                <Input id="mem-asset" type="number" required value={form.assetId} onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))} />
              </div>
              <EnumSelectField id="mem-role" label="Role" required options={MEMBER_ROLES} value={form.memberRole} onChange={(v) => setForm((f) => ({ ...f, memberRole: v }))} />
              <div className="space-y-1.5">
                <Label htmlFor="mem-priority">Node Priority</Label>
                <Input id="mem-priority" type="number" value={form.nodePriority} onChange={(e) => setForm((f) => ({ ...f, nodePriority: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mem-notes">Notes</Label>
                <Input id="mem-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
