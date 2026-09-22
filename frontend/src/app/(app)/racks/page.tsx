"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/auth/auth-context";
import type { RackListItem } from "@/lib/racks/types";

export default function RacksPage() {
  const perm = usePermission("racks");

  const [items, setItems] = React.useState<RackListItem[] | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch("/api/racks");
    if (res.ok) setItems(await res.json());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: RackListItem) {
    if (!window.confirm(`Delete rack "${item.rackName}"? This fails if it still has devices mounted.`)) return;
    const res = await apiFetch(`/api/racks/${item.rackId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      window.alert(data?.message ?? "Could not delete the rack.");
      return;
    }
    await load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Racks {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">Physical racks, U utilization, and device elevation.</p>
        </div>
        {perm.canCreate && (
          <Link href="/racks/new">
            <Button size="sm">+ New Rack</Button>
          </Link>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">U Used</th>
              <th className="px-3 py-2 font-medium">Weight</th>
              <th className="px-3 py-2 font-medium">Power</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-text-tertiary">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-text-tertiary">No racks registered.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.rackId} className={cn(!item.isActive && "opacity-60")}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{item.rackCode}</td>
                  <td className="px-3 py-2 text-text-primary">
                    <Link href={`/racks/${item.rackId}`} className="hover:underline">{item.rackName}</Link>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.locationPath ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.usedU} / {item.totalU}{item.uUsedPercent != null ? ` (${item.uUsedPercent}%)` : ""}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    <span className={cn(item.isOverWeight && "font-medium text-red-600 dark:text-red-400")}>
                      {item.totalWeightKg != null ? `${item.totalWeightKg.toLocaleString()} kg` : "—"}
                      {item.isOverWeight && <AlertTriangle className="ml-1 inline size-3" />}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    <span className={cn(item.isOverPower && "font-medium text-red-600 dark:text-red-400")}>
                      {item.totalPowerKw != null ? `${item.totalPowerKw.toLocaleString()} kW` : "—"}
                      {item.isOverPower && <AlertTriangle className="ml-1 inline size-3" />}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(perm.canEdit || perm.canDelete) && (
                      <div className="inline-flex gap-1">
                        {perm.canEdit && (
                          <Link href={`/racks/${item.rackId}`}>
                            <Button variant="ghost" size="icon" aria-label="Edit">
                              <Pencil className="size-4" />
                            </Button>
                          </Link>
                        )}
                        {perm.canDelete && (
                          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(item)}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
