"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnumSelectField } from "@/components/assets/form-fields";
import { emptyLocationForm, type LocationForm, type LocationTreeNode } from "@/lib/locations/types";

// Mirrors CHECK constraint CK_locations_type in docs/database/02-schema-sqlserver.sql.
const LOCATION_TYPES = ["SITE", "BUILDING", "FLOOR", "ROOM", "RACK"];

function flatten(nodes: LocationTreeNode[], depth = 0): Array<{ node: LocationTreeNode; depth: number }> {
  return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children, depth + 1)]);
}

/** Every descendant id of `locationId`, used to keep the parent picker from offering a cycle. */
function descendantIds(node: LocationTreeNode): number[] {
  return node.children.flatMap((c) => [c.locationId, ...descendantIds(c)]);
}

export default function LocationsPage() {
  const [tree, setTree] = React.useState<LocationTreeNode[] | null>(null);
  const [editing, setEditing] = React.useState<LocationTreeNode | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<LocationForm>(emptyLocationForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch("/api/locations/tree");
    if (res.ok) setTree(await res.json());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const rows = React.useMemo(() => (tree ? flatten(tree) : []), [tree]);

  const excludedParentIds = React.useMemo(() => {
    if (!editing) return new Set<number>();
    return new Set([editing.locationId, ...descendantIds(editing)]);
  }, [editing]);

  const parentOptions = rows
    .filter((r) => !excludedParentIds.has(r.node.locationId))
    .map((r) => ({ id: r.node.locationId, label: `${"— ".repeat(r.depth)}${r.node.name}` }));

  function openAdd(parent: LocationTreeNode | null) {
    setEditing(null);
    setForm({ ...emptyLocationForm, parentLocationId: parent ? String(parent.locationId) : "" });
    setError(null);
    setShowForm(true);
  }

  function openEdit(node: LocationTreeNode) {
    setEditing(node);
    setForm({
      parentLocationId: node.parentLocationId ? String(node.parentLocationId) : "",
      code: node.code,
      name: node.name,
      locationType: node.locationType,
      address: node.address ?? "",
      sortOrder: String(node.sortOrder),
      isActive: node.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = JSON.stringify({
      parentLocationId: form.parentLocationId ? Number(form.parentLocationId) : null,
      code: form.code.trim(),
      name: form.name.trim(),
      locationType: form.locationType,
      address: form.address.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    });

    const res = editing
      ? await apiFetch(`/api/locations/${editing.locationId}`, { method: "PUT", body })
      : await apiFetch("/api/locations", { method: "POST", body });

    setSubmitting(false);

    if (res.ok) {
      setShowForm(false);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save this location.");
    }
  }

  async function handleDelete(node: LocationTreeNode) {
    if (!window.confirm(`Delete "${node.name}"? This can't be undone.`)) return;
    const res = await apiFetch(`/api/locations/${node.locationId}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      const data = await res.json().catch(() => null);
      window.alert(data?.message ?? "Could not delete this location.");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Locations</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Site / Building / Floor / Room / Rack hierarchy used across Assets, Racks and Clusters.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => openAdd(null)}>
          <Plus className="mr-1 size-4" /> Add Root Location
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        {!tree ? (
          <p className="p-4 text-sm text-text-tertiary">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-text-tertiary">No locations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {rows.map(({ node, depth }) => (
                <tr key={node.locationId} className="bg-bg-surface">
                  <td className="whitespace-nowrap px-3 py-2 text-text-primary" style={{ paddingLeft: `${12 + depth * 20}px` }}>
                    <MapPin className="mr-1.5 inline size-3.5 text-text-tertiary" />
                    {node.name}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{node.code}</td>
                  <td className="px-3 py-2 text-text-secondary">{node.locationType}</td>
                  <td className="px-3 py-2 text-text-secondary">{node.address ?? "—"}</td>
                  <td className="px-3 py-2">
                    {node.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Active</span>
                    ) : (
                      <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Add sub-location" onClick={() => openAdd(node)}>
                        <Plus className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(node)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(node)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
            <h2 className="text-base font-semibold text-text-primary">{editing ? "Edit Location" : "Add Location"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="loc-parent">Parent Location</Label>
                <select
                  id="loc-parent"
                  value={form.parentLocationId}
                  onChange={(e) => setForm((f) => ({ ...f, parentLocationId: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
                >
                  <option value="">— Top level (Site) —</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-code">Code</Label>
                <Input id="loc-code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-name">Name</Label>
                <Input id="loc-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <EnumSelectField id="loc-type" label="Type" required options={LOCATION_TYPES} value={form.locationType} onChange={(v) => setForm((f) => ({ ...f, locationType: v }))} />
              <div className="space-y-1.5">
                <Label htmlFor="loc-address">Address</Label>
                <Input id="loc-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-sort">Sort Order</Label>
                <Input id="loc-sort" type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
              </div>
              <label htmlFor="loc-active" className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  id="loc-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="size-4 rounded border-border-strong"
                />
                Active
              </label>

              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
