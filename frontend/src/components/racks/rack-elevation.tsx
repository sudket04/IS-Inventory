"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/auth/auth-context";
import { Section, EnumSelectField } from "@/components/assets/form-fields";
import { emptyRackMountForm, type RackMountForm, type RackMountItem } from "@/lib/racks/types";

// Mirrors CHECK constraints in docs/database/11-module-v1.3b-details-rack-ipam.sql §5.
const MOUNT_FACES = ["FRONT", "REAR", "BOTH"];
const ORIENTATIONS = ["NORMAL", "REVERSED"];

// Tailwind can't see class names assembled from runtime data at build time, so the
// mapping has to be written out literally (docs/design/03-design-system.md §3 status colors).
const STATUS_BLOCK_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-100 border-sky-400 text-sky-800 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-300",
  amber: "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300",
  red: "bg-red-100 border-red-400 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300",
  slate: "bg-bg-subtle border-border-strong text-text-secondary",
};

const ROW_HEIGHT_PX = 26;

export function RackElevation({ rackId, totalU, numberingDirection }: { rackId: number; totalU: number; numberingDirection: string }) {
  const perm = usePermission("racks");

  const [items, setItems] = React.useState<RackMountItem[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<RackMountForm>(emptyRackMountForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/racks/${rackId}/elevation`);
    if (res.ok) setItems(await res.json());
  }, [rackId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await apiFetch(`/api/racks/${rackId}/mounts`, {
      method: "POST",
      body: JSON.stringify({
        assetId: Number(form.assetId),
        startU: Number(form.startU),
        uHeight: Number(form.uHeight),
        mountFace: form.mountFace,
        orientation: form.orientation,
        mountedDate: null,
        notes: form.notes.trim() || null,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setAdding(false);
      setForm(emptyRackMountForm);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not mount the device.");
    }
  }

  async function handleRemove(item: RackMountItem) {
    if (!window.confirm(`Remove ${item.assetTag} from this rack? Its mount history stays on record.`)) return;
    await apiFetch(`/api/rack-mounts/${item.rackMountId}/remove`, { method: "POST" });
    await load();
  }

  async function handleDelete(item: RackMountItem) {
    if (!window.confirm(`Permanently delete this mount record for ${item.assetTag}?`)) return;
    await apiFetch(`/api/rack-mounts/${item.rackMountId}`, { method: "DELETE" });
    await load();
  }

  function rowTop(startU: number, endU: number) {
    return numberingDirection === "BOTTOM_UP" ? totalU - endU + 1 : startU;
  }

  return (
    <Section title="Elevation">
      {perm.canCreate && (
        <div className="col-span-full mb-3">
          <Button type="button" size="sm" onClick={() => { setForm(emptyRackMountForm); setError(null); setAdding(true); }}>+ Mount Device</Button>
        </div>
      )}

      {!items ? (
        <p className="col-span-full text-sm text-text-tertiary">Loading…</p>
      ) : (
        <div className="col-span-full overflow-hidden rounded-md border border-border-default">
          <div
            className="grid"
            style={{ gridTemplateColumns: "2.5rem 1fr", gridTemplateRows: `repeat(${totalU}, ${ROW_HEIGHT_PX}px)` }}
          >
            {Array.from({ length: totalU }, (_, i) => i + 1).map((u) => {
              const row = numberingDirection === "BOTTOM_UP" ? totalU - u + 1 : u;
              return (
                <React.Fragment key={u}>
                  <div
                    className="flex items-center justify-end border-b border-r border-border-default bg-bg-subtle pr-1.5 text-[10px] text-text-tertiary"
                    style={{ gridColumn: 1, gridRow: row }}
                  >
                    {u}
                  </div>
                  <div
                    className="border-b border-border-default"
                    style={{ gridColumn: 2, gridRow: row }}
                  />
                </React.Fragment>
              );
            })}

            {items.map((item) => {
              const classes = STATUS_BLOCK_CLASSES[item.statusColor] ?? STATUS_BLOCK_CLASSES.slate;
              const top = rowTop(item.startU, item.endU ?? item.startU + item.uHeight - 1);
              return (
                <div
                  key={item.rackMountId}
                  className={cn("group relative flex items-center justify-between gap-2 overflow-hidden border-2 px-2 text-xs", classes)}
                  style={{ gridColumn: 2, gridRow: `${top} / span ${item.uHeight}` }}
                >
                  <Link href={`/assets/${item.assetId}`} className="min-w-0 truncate hover:underline">
                    <span className="font-mono">{item.assetTag}</span> {item.assetName}
                    {item.modelName ? ` · ${item.modelName}` : ""}
                  </Link>
                  {perm.canDelete && (
                    <div className="hidden shrink-0 gap-1 group-hover:flex">
                      <button type="button" title="Remove from rack" onClick={() => handleRemove(item)} className="rounded hover:bg-black/10">
                        <LogOut className="size-3.5" />
                      </button>
                      <button type="button" title="Delete mount record" onClick={() => handleDelete(item)} className="rounded hover:bg-black/10">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">Mount Device</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mount-asset">Asset ID</Label>
                <Input id="mount-asset" type="number" required value={form.assetId} onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mount-start">Start U</Label>
                  <Input id="mount-start" type="number" min="1" required value={form.startU} onChange={(e) => setForm((f) => ({ ...f, startU: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mount-height">U Height</Label>
                  <Input id="mount-height" type="number" min="1" required value={form.uHeight} onChange={(e) => setForm((f) => ({ ...f, uHeight: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EnumSelectField id="mount-face" label="Mount Face" required options={MOUNT_FACES} value={form.mountFace} onChange={(v) => setForm((f) => ({ ...f, mountFace: v }))} />
                <EnumSelectField id="mount-orient" label="Orientation" required options={ORIENTATIONS} value={form.orientation} onChange={(v) => setForm((f) => ({ ...f, orientation: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mount-notes">Notes</Label>
                <Input id="mount-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Mount"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
