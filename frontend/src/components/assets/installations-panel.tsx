"use client";

import * as React from "react";
import { Laptop, Trash2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/lib/auth/auth-context";
import { Section } from "@/components/assets/form-fields";
import { usePicker } from "@/lib/assets/options";
import { formatDate } from "@/lib/format";
import {
  emptySoftwareInstallationForm,
  type SoftwareInstallationForm,
  type SoftwareInstallationItem,
  type SeatUsageItem,
} from "@/lib/software/types";

/** FR-SW-03..05: which assets this Software License is installed on, with seat usage from contract_assets.seat_count (v1.4). */
export function InstallationsPanel({ softwareAssetId }: { softwareAssetId: number }) {
  const perm = usePermission("software");

  const allAssets = usePicker("assets");
  const targetOptions = allAssets.filter((a) => a.id !== softwareAssetId);

  const [items, setItems] = React.useState<SoftwareInstallationItem[] | null>(null);
  const [seatUsage, setSeatUsage] = React.useState<SeatUsageItem | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<SoftwareInstallationForm>(emptySoftwareInstallationForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [installRes, seatRes] = await Promise.all([
      apiFetch(`/api/assets/${softwareAssetId}/installations`),
      apiFetch(`/api/assets/${softwareAssetId}/seat-usage`),
    ]);
    if (installRes.ok) setItems(await installRes.json());
    if (seatRes.ok) setSeatUsage(await seatRes.json());
  }, [softwareAssetId]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm(emptySoftwareInstallationForm);
    setError(null);
    setAdding(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      targetAssetId: Number(form.targetAssetId),
      installedDate: form.installedDate.trim() || null,
      installedVersion: form.installedVersion.trim() || null,
      notes: form.notes.trim() || null,
    };

    const res = await apiFetch(`/api/assets/${softwareAssetId}/installations`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (res.ok) {
      setAdding(false);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not install this software.");
    }
  }

  async function handleUninstall(item: SoftwareInstallationItem) {
    if (!window.confirm(`Uninstall from "${item.targetAssetTag}"?`)) return;
    await apiFetch(`/api/software-installations/${item.installationId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Installations & Seat Usage">
      {seatUsage && (
        <div className="col-span-full mb-3 flex flex-wrap items-center gap-3 rounded-md border border-border-default bg-bg-subtle p-3 text-sm">
          <span className="font-medium text-text-primary">
            {seatUsage.seatsUsed} / {seatUsage.seatsPurchased} seats used
          </span>
          {seatUsage.seatsAvailable !== null && seatUsage.seatsAvailable >= 0 && (
            <span className="text-text-tertiary">{seatUsage.seatsAvailable} available</span>
          )}
          {seatUsage.isOverDeployed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle className="size-3.5" /> Over-deployed by {seatUsage.overDeployedCount}
            </span>
          )}
          {seatUsage.currentContractNo && (
            <span className="text-text-tertiary">Contract: {seatUsage.currentContractNo}</span>
          )}
          {seatUsage.daysUntilExpiry !== null && (
            <span className="text-text-tertiary">
              {seatUsage.daysUntilExpiry < 0 ? "Expired" : `${seatUsage.daysUntilExpiry} days until expiry`}
            </span>
          )}
        </div>
      )}

      {perm.canCreate && (
        <div className="col-span-full mb-3">
          <Button type="button" size="sm" onClick={openAdd}>+ Install On Asset</Button>
        </div>
      )}

      <div className="col-span-full">
        {!items ? (
          <p className="text-sm text-text-tertiary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-tertiary">Not installed on any asset yet.</p>
        ) : (
          <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
            {items.map((item) => (
              <li key={item.installationId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
                <Laptop className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary">
                    {item.targetAssetTag} — {item.targetAssetName}
                    {!item.isActive && <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Uninstalled</span>}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {item.installedVersion ? `v${item.installedVersion} · ` : ""}
                    Installed {formatDate(item.installedDate)}
                    {item.removedDate ? ` · Removed ${formatDate(item.removedDate)}` : ""}
                  </p>
                  {item.notes && <p className="mt-0.5 text-xs text-text-tertiary">{item.notes}</p>}
                </div>
                {perm.canDelete && item.isActive && (
                  <Button variant="ghost" size="icon" aria-label="Uninstall" onClick={() => handleUninstall(item)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">Install On Asset</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inst-target">Target Asset</Label>
                <select
                  id="inst-target"
                  required
                  value={form.targetAssetId}
                  onChange={(e) => setForm((f) => ({ ...f, targetAssetId: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
                >
                  <option value="" disabled>Select…</option>
                  {targetOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inst-date">Installed Date</Label>
                  <input id="inst-date" type="date" value={form.installedDate} onChange={(e) => setForm((f) => ({ ...f, installedDate: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inst-version">Version</Label>
                  <input id="inst-version" value={form.installedVersion} onChange={(e) => setForm((f) => ({ ...f, installedVersion: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inst-notes">Notes</Label>
                <textarea id="inst-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="h-16 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary" />
              </div>

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting || !form.targetAssetId}>{submitting ? "Saving…" : "Install"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
