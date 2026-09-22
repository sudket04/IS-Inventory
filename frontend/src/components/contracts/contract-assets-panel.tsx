"use client";

import * as React from "react";
import Link from "next/link";
import { Server, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/lib/auth/auth-context";
import { Section } from "@/components/assets/form-fields";
import { usePicker } from "@/lib/assets/options";
import { formatDate } from "@/lib/format";
import {
  emptyContractAssetForm,
  type ContractAssetForm,
  type ContractAssetItem,
} from "@/lib/contracts/types";

/** Single-asset and multi-asset coverage — a contract covers whichever assets have a row here (v1.4). */
export function ContractAssetsPanel({ contractId }: { contractId: number }) {
  const perm = usePermission("contracts");

  const allAssets = usePicker("assets");

  const [items, setItems] = React.useState<ContractAssetItem[] | null>(null);
  const [editing, setEditing] = React.useState<ContractAssetItem | "new" | null>(null);
  const [form, setForm] = React.useState<ContractAssetForm>(emptyContractAssetForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/contracts/${contractId}/assets`);
    if (res.ok) setItems(await res.json());
  }, [contractId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const linkedAssetIds = new Set(items?.map((i) => i.assetId) ?? []);
  const availableAssets = allAssets.filter((a) => !linkedAssetIds.has(a.id));

  function openNew() {
    setForm(emptyContractAssetForm);
    setError(null);
    setEditing("new");
  }

  function openEdit(item: ContractAssetItem) {
    setForm({
      assetId: String(item.assetId),
      coverageStart: item.coverageStart,
      coverageEnd: item.coverageEnd,
      allocatedCost: item.allocatedCost?.toString() ?? "",
      seatCount: item.seatCount?.toString() ?? "",
      serviceLevelNote: item.serviceLevelNote ?? "",
      notes: item.notes ?? "",
    });
    setError(null);
    setEditing(item);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const isNew = editing === "new";
    const body = {
      ...(isNew ? { assetId: Number(form.assetId) } : {}),
      coverageStart: form.coverageStart,
      coverageEnd: form.coverageEnd,
      allocatedCost: form.allocatedCost.trim() === "" ? null : Number(form.allocatedCost),
      seatCount: form.seatCount.trim() === "" ? null : Number(form.seatCount),
      serviceLevelNote: form.serviceLevelNote.trim() || null,
      notes: form.notes.trim() || null,
    };

    const res = isNew
      ? await apiFetch(`/api/contracts/${contractId}/assets`, { method: "POST", body: JSON.stringify(body) })
      : await apiFetch(`/api/contracts/${contractId}/assets/${(editing as ContractAssetItem).contractAssetId}`, { method: "PUT", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      setEditing(null);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save this asset link.");
    }
  }

  async function handleDelete(item: ContractAssetItem) {
    if (!window.confirm(`Remove "${item.assetTag}" from this contract?`)) return;
    await apiFetch(`/api/contracts/${contractId}/assets/${item.contractAssetId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Covered Assets">
      {perm.canCreate && (
        <div className="col-span-full mb-3">
          <Button type="button" size="sm" onClick={openNew} disabled={availableAssets.length === 0}>+ Link Asset</Button>
        </div>
      )}

      <div className="col-span-full">
        {!items ? (
          <p className="text-sm text-text-tertiary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-tertiary">No assets linked to this contract yet.</p>
        ) : (
          <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
            {items.map((item) => (
              <li key={item.contractAssetId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
                <Server className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary">
                    <Link href={`/assets/${item.assetId}`} className="text-accent-text hover:underline">
                      {item.assetTag} — {item.assetName}
                    </Link>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {formatDate(item.coverageStart)} – {formatDate(item.coverageEnd)}
                    {item.seatCount != null ? ` · ${item.seatCount} seats` : ""}
                    {item.allocatedCost != null ? ` · ${item.allocatedCost.toLocaleString()}` : ""}
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
                      <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => handleDelete(item)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">
              {editing === "new" ? "Link Asset" : "Edit Coverage"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {editing === "new" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ca-asset">Asset</Label>
                  <select id="ca-asset" required value={form.assetId} onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary">
                    <option value="" disabled>Select…</option>
                    {availableAssets.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ca-start">Coverage Start</Label>
                  <input id="ca-start" type="date" required value={form.coverageStart} onChange={(e) => setForm((f) => ({ ...f, coverageStart: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ca-end">Coverage End</Label>
                  <input id="ca-end" type="date" required value={form.coverageEnd} onChange={(e) => setForm((f) => ({ ...f, coverageEnd: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ca-seats">Seat Count (Software)</Label>
                  <input id="ca-seats" type="number" value={form.seatCount} onChange={(e) => setForm((f) => ({ ...f, seatCount: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ca-cost">Allocated Cost</Label>
                  <input id="ca-cost" type="number" value={form.allocatedCost} onChange={(e) => setForm((f) => ({ ...f, allocatedCost: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ca-sla-note">Service Level Note</Label>
                <input id="ca-sla-note" value={form.serviceLevelNote} onChange={(e) => setForm((f) => ({ ...f, serviceLevelNote: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ca-notes">Notes</Label>
                <textarea id="ca-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
