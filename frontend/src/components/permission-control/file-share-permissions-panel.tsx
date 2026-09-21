"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { usePicker } from "@/lib/assets/options";
import { useAccessLevelOptions } from "@/lib/permission-control/options";
import type { FileSharePermissionItem, PermissionVersionItem } from "@/lib/permission-control/types";

export function FileSharePermissionsPanel({ shareId, canEdit }: { shareId: number; canEdit: boolean }) {
  const [permissions, setPermissions] = React.useState<FileSharePermissionItem[] | null>(null);
  const [history, setHistory] = React.useState<PermissionVersionItem[] | null>(null);
  const [showAllHistory, setShowAllHistory] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [adGroupId, setAdGroupId] = React.useState("");
  const [adGroupNameRaw, setAdGroupNameRaw] = React.useState("");
  const [accessLevelId, setAccessLevelId] = React.useState("");
  const [grantedReason, setGrantedReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const adGroups = usePicker("ad-groups");
  const accessLevels = useAccessLevelOptions();

  const loadPermissions = React.useCallback(async () => {
    const res = await apiFetch(`/api/file-shares/${shareId}/permissions`);
    if (res.ok) setPermissions(await res.json());
  }, [shareId]);

  const loadHistory = React.useCallback(async () => {
    const res = await apiFetch(`/api/file-shares/${shareId}/history?all=${showAllHistory}`);
    if (res.ok) setHistory(await res.json());
  }, [shareId, showAllHistory]);

  React.useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accessLevelId || !adGroupNameRaw.trim()) return;

    const res = await apiFetch(`/api/file-shares/${shareId}/permissions`, {
      method: "POST",
      body: JSON.stringify({
        adGroupId: adGroupId === "" ? null : Number(adGroupId),
        adGroupNameRaw: adGroupNameRaw.trim(),
        accessLevelId: Number(accessLevelId),
        grantedReason: grantedReason.trim() === "" ? null : grantedReason.trim(),
      }),
    });

    if (res.ok) {
      setShowAdd(false);
      setAdGroupId("");
      setAdGroupNameRaw("");
      setAccessLevelId("");
      setGrantedReason("");
      await loadPermissions();
      await loadHistory();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not grant this permission.");
    }
  }

  async function handleRemove(permissionId: number) {
    if (!window.confirm("Revoke this AD group's access?")) return;
    await apiFetch(`/api/file-shares/${shareId}/permissions/${permissionId}`, { method: "DELETE" });
    await loadPermissions();
    await loadHistory();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
          <h2 className="text-sm font-semibold text-text-primary">AD Group Permissions</h2>
          {canEdit && (
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              + Grant Access
            </Button>
          )}
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="space-y-2 border-b border-border-default p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-text-tertiary">Known AD Group (if already synced)</label>
                <select
                  value={adGroupId}
                  onChange={(e) => {
                    setAdGroupId(e.target.value);
                    const opt = adGroups.find((o) => String(o.id) === e.target.value);
                    if (opt) setAdGroupNameRaw(opt.label);
                  }}
                  className="h-8 w-full rounded-md border border-border-default bg-bg-surface px-2 text-sm"
                >
                  <option value="">— Not synced yet, type below —</option>
                  {adGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tertiary">AD Group Name</label>
                <input
                  required
                  value={adGroupNameRaw}
                  onChange={(e) => setAdGroupNameRaw(e.target.value)}
                  placeholder="GRP-Finance-RW"
                  className="h-8 w-full rounded-md border border-border-default bg-bg-surface px-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary">Access Level</label>
                <select required value={accessLevelId} onChange={(e) => setAccessLevelId(e.target.value)} className="h-8 w-full rounded-md border border-border-default bg-bg-surface px-2 text-sm">
                  <option value="">— Select —</option>
                  {accessLevels.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tertiary">Reason</label>
                <input value={grantedReason} onChange={(e) => setGrantedReason(e.target.value)} className="h-8 w-full rounded-md border border-border-default bg-bg-surface px-2 text-sm" />
              </div>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" size="sm">Grant</Button>
            </div>
          </form>
        )}

        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">AD Group</th>
              <th className="px-3 py-2 font-medium">Access</th>
              <th className="px-3 py-2 font-medium">Reason</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {!permissions ? (
              <tr><td colSpan={4} className="px-3 py-3 text-center text-text-tertiary">Loading…</td></tr>
            ) : permissions.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-3 text-center text-text-tertiary">No AD groups granted yet.</td></tr>
            ) : (
              permissions.map((p) => (
                <tr key={p.permissionId}>
                  <td className="px-3 py-2 text-text-primary">
                    <div className="flex items-center gap-1.5">
                      {p.adGroupName}
                      {p.isOrphanGroup && (
                        <span title="This AD group is not (yet) confirmed to exist in AD — sync pending or the group was removed.">
                          <AlertTriangle className="size-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusBadge colorToken={p.colorToken} label={p.accessLevelName} /></td>
                  <td className="px-3 py-2 text-text-secondary">{p.grantedReason ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(p.permissionId)}>Revoke</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
          <h2 className="text-sm font-semibold text-text-primary">Permission History {showAllHistory ? "(All)" : "(Last 3)"}</h2>
          <Button size="sm" variant="outline" onClick={() => setShowAllHistory((v) => !v)}>
            {showAllHistory ? "Show Last 3" : "View All"}
          </Button>
        </div>
        <ul className="divide-y divide-border-default text-sm">
          {!history ? (
            <li className="px-3 py-3 text-center text-text-tertiary">Loading…</li>
          ) : history.length === 0 ? (
            <li className="px-3 py-3 text-center text-text-tertiary">No permission changes recorded yet.</li>
          ) : (
            history.map((h, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2">
                <span className="w-36 shrink-0 text-xs text-text-tertiary">{formatDateTime(h.changedAtUtc)}</span>
                <span className="w-28 shrink-0 font-medium text-text-primary">{h.changeActionTh}</span>
                <span className="text-text-secondary">
                  {h.adGroupName} → {h.accessLevelName}
                  {h.previousAccessLevelName && h.previousAccessLevelName !== h.accessLevelName ? ` (was ${h.previousAccessLevelName})` : ""}
                </span>
                <span className="ml-auto text-xs text-text-tertiary">{h.changedByName ?? "—"}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
