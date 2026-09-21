"use client";

import * as React from "react";
import Link from "next/link";
import { Share2, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { Section } from "@/components/assets/form-fields";
import { usePicker } from "@/lib/assets/options";
import {
  emptyAssetRelationshipForm,
  type AssetRelationshipForm,
  type AssetRelationshipItem,
  type RelationshipTypeOption,
} from "@/lib/relationships/types";

/** FR-CM-02: CMDB-style asset-to-asset relationships (Hosted On/Hosts, Depends On/Required By, …). */
export function RelationshipsPanel({ assetId }: { assetId: number }) {
  const { user } = useAuth();
  const canManage = user?.roleCode === "ADMIN" || user?.roleCode === "IT_STAFF";

  const allAssets = usePicker("assets");
  const targetOptions = allAssets.filter((a) => a.id !== assetId);

  const [relationshipTypes, setRelationshipTypes] = React.useState<RelationshipTypeOption[]>([]);
  const [items, setItems] = React.useState<AssetRelationshipItem[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<AssetRelationshipForm>(emptyAssetRelationshipForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/assets/${assetId}/relationships`);
    if (res.ok) setItems(await res.json());
  }, [assetId]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    apiFetch("/api/pickers/relationship-types")
      .then((res) => (res.ok ? res.json() : []))
      .then(setRelationshipTypes)
      .catch(() => setRelationshipTypes([]));
  }, []);

  function openAdd() {
    setForm(emptyAssetRelationshipForm);
    setError(null);
    setAdding(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      targetAssetId: Number(form.targetAssetId),
      relationshipTypeId: Number(form.relationshipTypeId),
      notes: form.notes.trim() || null,
    };

    const res = await apiFetch(`/api/assets/${assetId}/relationships`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (res.ok) {
      setAdding(false);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not create this relationship.");
    }
  }

  async function handleDelete(item: AssetRelationshipItem) {
    if (!window.confirm(`Remove "${item.relationshipName}" → ${item.relatedAssetTag}?`)) return;
    await apiFetch(`/api/assets/${assetId}/relationships/${item.relationshipId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Relationships">
      {canManage && (
        <div className="col-span-full mb-3">
          <Button type="button" size="sm" onClick={openAdd}>+ Add Relationship</Button>
        </div>
      )}

      <div className="col-span-full">
        {!items ? (
          <p className="text-sm text-text-tertiary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-tertiary">No relationships recorded for this asset.</p>
        ) : (
          <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
            {items.map((item) => (
              <li key={item.relationshipId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
                <Share2 className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary">
                    {item.relationshipName}{" "}
                    <Link href={`/assets/${item.toAssetId}`} className="text-accent-text hover:underline">
                      {item.relatedAssetTag} — {item.relatedAssetName}
                    </Link>
                    <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">
                      {item.direction === "OUTGOING" ? "→" : "←"}
                    </span>
                  </p>
                  {item.notes && <p className="mt-0.5 text-xs text-text-tertiary">{item.notes}</p>}
                </div>
                {canManage && (
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => handleDelete(item)}>
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
            <h2 className="text-base font-semibold text-text-primary">Add Relationship</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rel-type">Relationship</Label>
                <select
                  id="rel-type"
                  required
                  value={form.relationshipTypeId}
                  onChange={(e) => setForm((f) => ({ ...f, relationshipTypeId: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
                >
                  <option value="" disabled>Select…</option>
                  {relationshipTypes.map((t) => <option key={t.id} value={t.id}>{t.forwardName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rel-target">Related Asset</Label>
                <select
                  id="rel-target"
                  required
                  value={form.targetAssetId}
                  onChange={(e) => setForm((f) => ({ ...f, targetAssetId: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
                >
                  <option value="" disabled>Select…</option>
                  {targetOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rel-notes">Notes</Label>
                <textarea id="rel-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="h-16 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary" />
              </div>

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting || !form.targetAssetId || !form.relationshipTypeId}>
                  {submitting ? "Saving…" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
