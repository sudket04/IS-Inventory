"use client";

import * as React from "react";
import { Network, Trash2, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { usePermission } from "@/lib/auth/auth-context";
import { Section, TextField, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyVlanIpRangeForm, type VlanIpRangeForm, type VlanIpRangeItem } from "@/lib/vlans/types";

// Mirrors CHECK constraint CK_ranges_type in docs/database/04-vlan-module.sql §4.
const RANGE_TYPES = ["STATIC", "DHCP", "RESERVED", "EXCLUDED"];
const DHCP_SOURCE_TYPES = ["FIREWALL", "CORE_SWITCH", "L3_SWITCH", "ROUTER", "DHCP_SERVER", "EXTERNAL"];

const TYPE_CLASSES: Record<string, string> = {
  STATIC: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  DHCP: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  RESERVED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  EXCLUDED: "bg-bg-subtle text-text-tertiary",
};

export function VlanIpRangesPanel({ vlanId }: { vlanId: number }) {
  const perm = usePermission("vlans");
  const assets = usePicker("assets");

  const [items, setItems] = React.useState<VlanIpRangeItem[] | null>(null);
  const [editing, setEditing] = React.useState<VlanIpRangeItem | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<VlanIpRangeForm>(emptyVlanIpRangeForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch(`/api/vlans/${vlanId}/ranges`);
    if (res.ok) setItems(await res.json());
  }, [vlanId]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(emptyVlanIpRangeForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: VlanIpRangeItem) {
    setEditing(item);
    setForm({
      rangeType: item.rangeType,
      startIp: item.startIp,
      endIp: item.endIp,
      dhcpSourceType: item.dhcpSourceType ?? "",
      dhcpServerAssetId: "",
      description: item.description ?? "",
      isActive: item.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = JSON.stringify({
      rangeType: form.rangeType,
      startIp: form.startIp.trim(),
      endIp: form.endIp.trim(),
      dhcpSourceType: form.rangeType === "DHCP" && form.dhcpSourceType ? form.dhcpSourceType : null,
      dhcpServerAssetId: form.rangeType === "DHCP" && form.dhcpServerAssetId ? Number(form.dhcpServerAssetId) : null,
      description: form.description.trim() || null,
      isActive: form.isActive,
    });

    const res = editing
      ? await apiFetch(`/api/vlan-ranges/${editing.rangeId}`, { method: "PUT", body })
      : await apiFetch(`/api/vlans/${vlanId}/ranges`, { method: "POST", body });

    setSubmitting(false);

    if (res.ok) {
      setShowForm(false);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save this IP range.");
    }
  }

  async function handleDelete(item: VlanIpRangeItem) {
    if (!window.confirm(`Delete range ${item.startIp} - ${item.endIp}?`)) return;
    const res = await apiFetch(`/api/vlan-ranges/${item.rangeId}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      const data = await res.json().catch(() => null);
      window.alert(data?.message ?? "Could not delete this range.");
    }
  }

  return (
    <Section title="IP Ranges">
      {perm.canCreate && (
        <div className="col-span-full mb-1">
          <Button type="button" size="sm" onClick={openAdd}>+ Add Range</Button>
        </div>
      )}

      <div className="col-span-full">
        {!items ? (
          <p className="text-sm text-text-tertiary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-tertiary">No IP ranges defined.</p>
        ) : (
          <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
            {items.map((item) => (
              <li key={item.rangeId} className="flex items-start gap-3 bg-bg-surface px-3 py-2 text-sm">
                <Network className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary">
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[item.rangeType] ?? "bg-bg-subtle text-text-tertiary"}`}>{item.rangeType}</span>
                    {item.startIp} – {item.endIp}
                    {!item.isActive && <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Inactive</span>}
                  </p>
                  {(item.dhcpServerAssetTag || item.dhcpServerNameDisplay || item.description) && (
                    <p className="text-xs text-text-tertiary">
                      {item.dhcpServerAssetTag && `via ${item.dhcpServerAssetTag}`}
                      {item.description ? (item.dhcpServerAssetTag ? ` · ${item.description}` : item.description) : ""}
                    </p>
                  )}
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
      </div>

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">{editing ? "Edit Range" : "Add Range"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <EnumSelectField id="range-type" label="Range Type" required options={RANGE_TYPES} value={form.rangeType} onChange={(v) => setForm((f) => ({ ...f, rangeType: v }))} />
              <TextField id="range-start" label="Start IP" required value={form.startIp} onChange={(v) => setForm((f) => ({ ...f, startIp: v }))} />
              <TextField id="range-end" label="End IP" required value={form.endIp} onChange={(v) => setForm((f) => ({ ...f, endIp: v }))} />
              {form.rangeType === "DHCP" && (
                <>
                  <EnumSelectField id="range-dhcp-source" label="DHCP Source" options={DHCP_SOURCE_TYPES} value={form.dhcpSourceType} onChange={(v) => setForm((f) => ({ ...f, dhcpSourceType: v }))} />
                  <SelectField id="range-dhcp-asset" label="DHCP Server Asset" value={form.dhcpServerAssetId} onChange={(v) => setForm((f) => ({ ...f, dhcpServerAssetId: v }))} options={assets} />
                </>
              )}
              <TextField id="range-desc" label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
              <CheckboxField id="range-active" label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
