"use client";

import * as React from "react";
import { HardDrive, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/lib/auth/auth-context";
import { Section, EnumSelectField } from "@/components/assets/form-fields";
import { emptyStorageVolumeForm, type StorageVolumeForm, type StorageVolumeListItem } from "@/lib/storage-volumes/types";

// Mirror CHECK constraints in docs/database/06-module-v1.2.sql §4 — values outside these
// lists are rejected by the database, not just validated client-side.
const VOLUME_TYPES = [
  "LOCAL_DISK", "SAN_LUN", "NAS_SHARE", "VM_DATASTORE", "CLUSTER_SHARED_VOLUME",
  "BACKUP_REPOSITORY", "SCALE_OUT_REPOSITORY", "OBJECT_STORAGE", "TAPE_POOL", "CLOUD_TIER",
];
const STORAGE_PROTOCOLS = ["SAS", "SATA", "NVME", "ISCSI", "FC", "FCOE", "NFS", "SMB", "S3", "LTO", "LOCAL"];
const DISK_TYPES = ["SSD", "NVME", "SAS", "SATA", "TAPE", "CLOUD", "MIXED"];

type Owner = { assetId: number } | { clusterId: number };

export function StorageVolumesPanel({ owner }: { owner: Owner }) {
  // Matches backend StorageVolumesController's [RequiresPermission("clusters", ...)] on every
  // route — asset-owned and cluster-owned volumes are both gated by the Clusters menu.
  const perm = usePermission("clusters");
  const basePath = "assetId" in owner ? `/api/assets/${owner.assetId}/storage-volumes` : `/api/clusters/${owner.clusterId}/storage-volumes`;

  const [items, setItems] = React.useState<StorageVolumeListItem[] | null>(null);
  const [editing, setEditing] = React.useState<StorageVolumeListItem | "new" | null>(null);
  const [form, setForm] = React.useState<StorageVolumeForm>(emptyStorageVolumeForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(basePath);
    if (res.ok) setItems(await res.json());
  }, [basePath]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(emptyStorageVolumeForm);
    setError(null);
    setEditing("new");
  }

  function openEdit(item: StorageVolumeListItem) {
    setForm({
      volumeName: item.volumeName,
      volumeType: item.volumeType,
      storageProtocol: item.storageProtocol ?? "",
      raidLevel: item.raidLevel ?? "",
      diskType: item.diskType ?? "",
      capacityGb: String(item.capacityGb),
      usedGb: item.usedGb != null ? String(item.usedGb) : "",
      lastMeasuredAt: item.lastMeasuredAt ?? "",
      mountPath: item.mountPath ?? "",
      providerAssetId: item.providerAssetId ? String(item.providerAssetId) : "",
      isThinProvisioned: item.isThinProvisioned ?? false,
      encryptionEnabled: item.encryptionEnabled ?? false,
      immutabilityDays: item.immutabilityDays != null ? String(item.immutabilityDays) : "",
      retentionDays: item.retentionDays != null ? String(item.retentionDays) : "",
      dedupRatio: item.dedupRatio != null ? String(item.dedupRatio) : "",
      notes: item.notes ?? "",
      isActive: item.isActive,
    });
    setError(null);
    setEditing(item);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      volumeName: form.volumeName.trim(),
      volumeType: form.volumeType,
      storageProtocol: form.storageProtocol || null,
      raidLevel: form.raidLevel.trim() || null,
      diskType: form.diskType || null,
      capacityGb: Number(form.capacityGb),
      usedGb: form.usedGb ? Number(form.usedGb) : null,
      lastMeasuredAt: form.lastMeasuredAt || null,
      mountPath: form.mountPath.trim() || null,
      providerAssetId: form.providerAssetId ? Number(form.providerAssetId) : null,
      isThinProvisioned: form.isThinProvisioned,
      encryptionEnabled: form.encryptionEnabled,
      immutabilityDays: form.immutabilityDays ? Number(form.immutabilityDays) : null,
      retentionDays: form.retentionDays ? Number(form.retentionDays) : null,
      dedupRatio: form.dedupRatio ? Number(form.dedupRatio) : null,
      notes: form.notes.trim() || null,
      isActive: form.isActive,
    };

    const res = editing === "new"
      ? await apiFetch(basePath, { method: "POST", body: JSON.stringify(body) })
      : await apiFetch(`/api/storage-volumes/${(editing as StorageVolumeListItem).volumeId}`, { method: "PUT", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      setEditing(null);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the storage volume.");
    }
  }

  async function handleDelete(item: StorageVolumeListItem) {
    if (!window.confirm(`Delete volume "${item.volumeName}"?`)) return;
    await apiFetch(`/api/storage-volumes/${item.volumeId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Storage Volumes">
      {perm.canCreate && (
        <div className="mb-3">
          <Button type="button" size="sm" onClick={openNew}>+ Add Volume</Button>
        </div>
      )}

      {!items ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-tertiary">No storage volumes recorded.</p>
      ) : (
        <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
          {items.map((item) => (
            <li key={item.volumeId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
              <HardDrive className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary">
                  {item.volumeName}
                  {!item.isActive && <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Inactive</span>}
                </p>
                <p className="text-xs text-text-tertiary">
                  {item.volumeType} · {item.capacityGb.toLocaleString()} GB
                  {item.usedPercent != null ? ` (${item.usedPercent}% used)` : ""}
                  {item.diskType ? ` · ${item.diskType}` : ""}
                  {item.storageProtocol ? ` · ${item.storageProtocol}` : ""}
                  {item.mountPath ? ` · ${item.mountPath}` : ""}
                  {item.providerAssetTag ? ` · Provided by ${item.providerAssetTag}` : ""}
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">
              {editing === "new" ? "Add Storage Volume" : "Edit Storage Volume"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="vol-name">Volume Name</Label>
                <Input id="vol-name" required value={form.volumeName} onChange={(e) => setForm((f) => ({ ...f, volumeName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EnumSelectField id="vol-type" label="Volume Type" required options={VOLUME_TYPES} value={form.volumeType} onChange={(v) => setForm((f) => ({ ...f, volumeType: v }))} />
                <EnumSelectField id="vol-disktype" label="Disk Type" options={DISK_TYPES} value={form.diskType} onChange={(v) => setForm((f) => ({ ...f, diskType: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EnumSelectField id="vol-protocol" label="Storage Protocol" options={STORAGE_PROTOCOLS} value={form.storageProtocol} onChange={(v) => setForm((f) => ({ ...f, storageProtocol: v }))} />
                <div className="space-y-1.5">
                  <Label htmlFor="vol-raid">RAID Level</Label>
                  <Input id="vol-raid" placeholder="RAID 10" value={form.raidLevel} onChange={(e) => setForm((f) => ({ ...f, raidLevel: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="vol-capacity">Capacity (GB)</Label>
                  <Input id="vol-capacity" type="number" min="0" step="0.01" required value={form.capacityGb} onChange={(e) => setForm((f) => ({ ...f, capacityGb: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vol-used">Used (GB)</Label>
                  <Input id="vol-used" type="number" min="0" step="0.01" value={form.usedGb} onChange={(e) => setForm((f) => ({ ...f, usedGb: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="vol-measured">Last Measured</Label>
                  <Input id="vol-measured" type="date" value={form.lastMeasuredAt} onChange={(e) => setForm((f) => ({ ...f, lastMeasuredAt: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vol-mount">Mount Path</Label>
                  <Input id="vol-mount" placeholder="/vmfs/volumes/ds01" value={form.mountPath} onChange={(e) => setForm((f) => ({ ...f, mountPath: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vol-provider">Provider Asset ID</Label>
                <Input id="vol-provider" type="number" placeholder="Asset ID of the SAN/NAS that provides this volume" value={form.providerAssetId} onChange={(e) => setForm((f) => ({ ...f, providerAssetId: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="vol-immutable">Immutability (days)</Label>
                  <Input id="vol-immutable" type="number" min="1" value={form.immutabilityDays} onChange={(e) => setForm((f) => ({ ...f, immutabilityDays: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vol-retention">Retention (days)</Label>
                  <Input id="vol-retention" type="number" min="0" value={form.retentionDays} onChange={(e) => setForm((f) => ({ ...f, retentionDays: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vol-dedup">Dedup Ratio</Label>
                  <Input id="vol-dedup" type="number" min="0" step="0.01" value={form.dedupRatio} onChange={(e) => setForm((f) => ({ ...f, dedupRatio: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" checked={form.isThinProvisioned} onChange={(e) => setForm((f) => ({ ...f, isThinProvisioned: e.target.checked }))} className="size-4 rounded border-border-strong" />
                  Thin Provisioned
                </label>
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" checked={form.encryptionEnabled} onChange={(e) => setForm((f) => ({ ...f, encryptionEnabled: e.target.checked }))} className="size-4 rounded border-border-strong" />
                  Encrypted
                </label>
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="size-4 rounded border-border-strong" />
                  Active
                </label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vol-notes">Notes</Label>
                <textarea id="vol-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
