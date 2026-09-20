"use client";

import * as React from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LookupConfig, LookupRow } from "@/lib/lookups/types";
import { LookupFormDialog } from "@/components/lookups/lookup-form-dialog";
import { UsageBlockedDialog } from "@/components/lookups/usage-blocked-dialog";

/**
 * Config-driven CRUD table for the 12 master-data pages that share one structure
 * (docs/design/04-settings-screens.md §4) — one component instead of 12 near-identical
 * pages. Each page just supplies a LookupConfig.
 */
export function LookupPage({ config }: { config: LookupConfig }) {
  const [rows, setRows] = React.useState<LookupRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showOnlyActive, setShowOnlyActive] = React.useState(true);
  const [editing, setEditing] = React.useState<LookupRow | "new" | null>(null);
  const [blockedDelete, setBlockedDelete] = React.useState<{
    row: LookupRow;
    usages: { label: string; count: number }[];
  } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/lookups/${config.key}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [config.key]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((row) => {
    if (showOnlyActive && row.isActive === false) return false;
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return config.searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle));
  });

  async function handleSave(values: Record<string, unknown>): Promise<string | null> {
    const isCreate = editing === "new";
    const id = isCreate ? null : (editing as LookupRow)[config.idKey];
    const res = await apiFetch(isCreate ? `/api/lookups/${config.key}` : `/api/lookups/${config.key}/${id}`, {
      method: isCreate ? "POST" : "PUT",
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return body.message ?? "Could not save. Please check the values and try again.";
    }

    setEditing(null);
    await load();
    return null;
  }

  async function handleSetActive(row: LookupRow, isActive: boolean) {
    await apiFetch(`/api/lookups/${config.key}/${row[config.idKey]}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    await load();
  }

  async function handleDeleteClick(row: LookupRow) {
    const res = await apiFetch(`/api/lookups/${config.key}/${row[config.idKey]}/usage`);
    const usages: { label: string; count: number }[] = res.ok ? await res.json() : [];

    if (usages.some((u) => u.count > 0)) {
      setBlockedDelete({ row, usages });
      return;
    }

    if (!window.confirm(`Delete "${row[config.columns[0]?.key ?? "name"] ?? "this record"}"? This cannot be undone.`)) {
      return;
    }

    await apiFetch(`/api/lookups/${config.key}/${row[config.idKey]}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {config.title} ({filtered.length})
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{config.description}</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          + Add {config.title}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary"
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="size-4 rounded border-border-strong"
          />
          Active only
        </label>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              {config.columns.map((col) => (
                <th key={col.key} className="px-3 py-2 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {loading ? (
              <tr>
                <td colSpan={config.columns.length + 2} className="px-3 py-4 text-center text-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 2} className="px-3 py-4 text-center text-text-tertiary">
                  No records found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={String(row[config.idKey])}>
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-text-primary">
                      {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleSetActive(row, !row.isActive)}
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        row.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-bg-subtle text-text-tertiary"
                      )}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(row)} aria-label="Delete">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <LookupFormDialog
          config={config}
          initial={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleSave}
        />
      )}

      {blockedDelete && (
        <UsageBlockedDialog
          title={String(blockedDelete.row[config.columns[0]?.key ?? "name"] ?? "")}
          usages={blockedDelete.usages}
          onCancel={() => setBlockedDelete(null)}
          onDeactivateInstead={async () => {
            await handleSetActive(blockedDelete.row, false);
            setBlockedDelete(null);
          }}
        />
      )}
    </div>
  );
}
