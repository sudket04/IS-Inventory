"use client";

import * as React from "react";
import Link from "next/link";
import { Users, LogOut, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/lib/auth/auth-context";
import { usePicker } from "@/lib/assets/options";
import { useAvailableClusterHardware } from "@/lib/clusters/options";
import { Section, EnumSelectField, SelectField } from "@/components/assets/form-fields";
import { formatDate } from "@/lib/format";
import { emptyClusterMemberForm, type ClusterMemberForm, type ClusterMemberItem } from "@/lib/clusters/types";

// Mirrors CHECK constraint CK_clmem_role in docs/database/06-module-v1.2.sql §3.
const MEMBER_ROLES = ["HOST", "NODE", "WITNESS", "MANAGER", "PROXY", "REPOSITORY", "GATEWAY", "TAPE_SERVER", "REPLICA"];
// HOST/NODE are the hypervisor-style "Host/Node" concept from the reference design — Server
// Hardware picker + its own host_name/ip_host/ip_mgmt. Every other role (witness, Veeam
// proxy/repository, DB replica, etc.) picks from any asset and has no host/IP fields.
const HOST_ROLES = new Set(["HOST", "NODE"]);

export function ClusterMembersPanel({ clusterId }: { clusterId: number }) {
  const perm = usePermission("clusters");

  const [items, setItems] = React.useState<ClusterMemberItem[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<ClusterMemberForm>(emptyClusterMemberForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isHostRole = HOST_ROLES.has(form.memberRole);
  const availableHardware = useAvailableClusterHardware();
  const allAssets = usePicker("assets");
  const assetOptions = isHostRole
    ? availableHardware.map((h) => ({ id: h.assetId, label: `${h.serialNumber ?? h.assetTag} — ${[h.manufacturerName, h.model].filter(Boolean).join(" ") || h.name}` }))
    : allAssets;

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
        hostName: isHostRole ? form.hostName.trim() || null : null,
        ipHost: isHostRole ? form.ipHost.trim() || null : null,
        ipMgmt: isHostRole ? form.ipMgmt.trim() || null : null,
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
    <Section title="Host / Node & Other Members">
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
                  {item.hostName ? <span className="font-medium">{item.hostName}</span> : (
                    <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                  )}
                  <span className="ml-2 text-text-secondary">
                    {[item.manufacturerName, item.model].filter(Boolean).join(" ") || item.assetName}
                    {item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}
                  </span>
                  {!item.isActive && <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Left {formatDate(item.leftDate)}</span>}
                </p>
                <p className="text-xs text-text-tertiary">
                  {item.memberRole}{item.nodePriority != null ? ` · Priority ${item.nodePriority}` : ""}{item.joinedDate ? ` · Joined ${formatDate(item.joinedDate)}` : ""}
                  {item.ipHost ? ` · IP Host ${item.ipHost}` : ""}{item.ipMgmt ? ` · IP Mgmt ${item.ipMgmt}` : ""}
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
              <EnumSelectField id="mem-role" label="Role" required options={MEMBER_ROLES} value={form.memberRole} onChange={(v) => setForm((f) => ({ ...f, memberRole: v, assetId: "" }))} />
              <SelectField id="mem-asset" label={isHostRole ? "Server Hardware" : "Asset"} required
                value={form.assetId} onChange={(v) => setForm((f) => ({ ...f, assetId: v }))}
                options={assetOptions} placeholder="— Select —" />
              {isHostRole && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="mem-host-name">Host name</Label>
                    <Input id="mem-host-name" value={form.hostName} onChange={(e) => setForm((f) => ({ ...f, hostName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mem-ip-host">IP Host</Label>
                    <Input id="mem-ip-host" placeholder="e.g. 192.168.10.1" value={form.ipHost} onChange={(e) => setForm((f) => ({ ...f, ipHost: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mem-ip-mgmt">IP Management (iDRAC/iLO)</Label>
                    <Input id="mem-ip-mgmt" placeholder="e.g. 192.168.1.10" value={form.ipMgmt} onChange={(e) => setForm((f) => ({ ...f, ipMgmt: e.target.value }))} />
                  </div>
                </>
              )}
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
                <Button type="submit" size="sm" disabled={submitting || !form.assetId}>{submitting ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
