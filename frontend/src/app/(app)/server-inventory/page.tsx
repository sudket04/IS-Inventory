"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Pencil, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { ServerInventoryListItem } from "@/lib/server-domain/types";

export default function ServerInventoryPage() {
  const [items, setItems] = React.useState<ServerInventoryListItem[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    const res = await apiFetch(`/api/server-inventory?${params.toString()}`);
    if (res.ok) setItems(await res.json());
  }, [search, category]);

  React.useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Server Inventory {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">Server hardware (Physical) และ Storage — ข้อมูลเชิง Hardware/จัดซื้อ</p>
        </div>
        <Link href="/server-inventory/new">
          <Button size="sm">+ New</Button>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input type="search" placeholder="Search asset tag, name, serial…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
          <option value="">All</option>
          <option value="SRV">Server</option>
          <option value="STG">Storage</option>
        </select>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Asset Tag</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Manufacturer / Model</th>
              <th className="px-3 py-2 font-medium">Serial</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Warranty Until</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">No hardware registered yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.assetId}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{item.assetTag}</td>
                  <td className="px-3 py-2 text-text-primary">
                    {item.name}
                    {item.categoryCode === "SRV" && !item.inUseByServerList && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title="ยังไม่ได้เพิ่มเข้า Server List">
                        <AlertTriangle className="size-3" /> ยังไม่ Activate
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.assetTypeName ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{[item.manufacturerName, item.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-text-secondary">{item.serialNumber ?? "—"}</td>
                  <td className="px-3 py-2"><StatusBadge colorToken={item.statusColorToken} label={item.statusName} /></td>
                  <td className="px-3 py-2 text-text-secondary">{item.warrantyUntil ? formatDate(item.warrantyUntil) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/server-inventory/${item.assetId}`}>
                      <Button variant="ghost" size="icon" aria-label="Edit"><Pencil className="size-4" /></Button>
                    </Link>
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
