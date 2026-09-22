"use client";

import * as React from "react";
import Link from "next/link";
import { Server, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { usePermission } from "@/lib/auth/auth-context";
import { Section, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyVlanDeviceForm, type VlanDeviceForm, type VlanDeviceItem } from "@/lib/vlans/types";

// Mirrors CHECK constraint CK_vlandev_role in docs/database/04-vlan-module.sql §5.
const DEVICE_ROLES = ["GATEWAY", "DHCP_SERVER", "DHCP_RELAY", "TRUNK", "ACCESS"];

export function VlanDevicesPanel({ vlanId }: { vlanId: number }) {
  const perm = usePermission("vlans");
  const assets = usePicker("assets");

  const [items, setItems] = React.useState<VlanDeviceItem[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<VlanDeviceForm>(emptyVlanDeviceForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/vlans/${vlanId}/devices`);
    if (res.ok) setItems(await res.json());
  }, [vlanId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await apiFetch(`/api/vlans/${vlanId}/devices`, {
      method: "POST",
      body: JSON.stringify({
        assetId: Number(form.assetId),
        deviceRole: form.deviceRole,
        interfaceName: form.interfaceName.trim() || null,
        isTagged: form.isTagged,
        notes: form.notes.trim() || null,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setAdding(false);
      setForm(emptyVlanDeviceForm);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not add this device.");
    }
  }

  async function handleRemove(item: VlanDeviceItem) {
    if (!window.confirm(`Remove ${item.assetTag} (${item.deviceRole}) from this VLAN?`)) return;
    await apiFetch(`/api/vlan-devices/${item.vlanDeviceId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Section title="Devices">
      {perm.canCreate && (
        <div className="col-span-full mb-1">
          <Button type="button" size="sm" onClick={() => { setForm(emptyVlanDeviceForm); setError(null); setAdding(true); }}>+ Add Device</Button>
        </div>
      )}

      <div className="col-span-full">
        {!items ? (
          <p className="text-sm text-text-tertiary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-tertiary">No devices linked.</p>
        ) : (
          <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
            {items.map((item) => (
              <li key={item.vlanDeviceId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
                <Server className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary">
                    <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                    <span className="ml-2 text-text-secondary">{item.assetName}</span>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {item.deviceRole}{item.interfaceName ? ` · ${item.interfaceName}` : ""}{item.isTagged != null ? ` · ${item.isTagged ? "Tagged" : "Untagged"}` : ""}
                  </p>
                  {item.notes && <p className="mt-0.5 text-xs text-text-tertiary">{item.notes}</p>}
                </div>
                {perm.canDelete && (
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => handleRemove(item)}>
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
            <h2 className="text-base font-semibold text-text-primary">Add Device</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <SelectField id="dev-asset" label="Asset" required value={form.assetId} onChange={(v) => setForm((f) => ({ ...f, assetId: v }))} options={assets} />
              <EnumSelectField id="dev-role" label="Role" required options={DEVICE_ROLES} value={form.deviceRole} onChange={(v) => setForm((f) => ({ ...f, deviceRole: v }))} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="dev-iface">Interface</label>
                <input id="dev-iface" value={form.interfaceName} onChange={(e) => setForm((f) => ({ ...f, interfaceName: e.target.value }))} className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
              </div>
              <CheckboxField id="dev-tagged" label="Tagged (Trunk)" checked={form.isTagged} onChange={(v) => setForm((f) => ({ ...f, isTagged: v }))} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="dev-notes">Notes</label>
                <input id="dev-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
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
