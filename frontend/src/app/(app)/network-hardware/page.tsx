"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { NetworkDeviceListItem } from "@/lib/network-hardware/types";

export default function NetworkHardwarePage() {
  const [items, setItems] = React.useState<NetworkDeviceListItem[] | null>(null);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const res = await apiFetch(`/api/network-devices?${params.toString()}`);
    if (res.ok) setItems(await res.json());
  }, [search]);

  React.useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Network Hardware {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">สวิตช์ / ไฟร์วอลล์ / อุปกรณ์เครือข่ายอื่นๆ</p>
        </div>
        <Link href="/network-hardware/new">
          <Button size="sm">+ New</Button>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input type="search" placeholder="Search asset tag, name, serial, MAC…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary" />
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Device Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Brand / Model</th>
              <th className="px-3 py-2 font-medium">MAC</th>
              <th className="px-3 py-2 font-medium">IP Management</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">EOL Date</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={9} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-4 text-center text-text-tertiary">No network devices registered yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.assetId}>
                  <td className="px-3 py-2"><StatusBadge colorToken={item.statusColorToken} label={item.statusName} /></td>
                  <td className="px-3 py-2 text-text-primary">{item.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.assetTypeName ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{[item.manufacturerName, item.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-text-secondary">{item.macAddress ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-text-secondary">{item.managementIpAddress ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.locationName ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.eolDate ? formatDate(item.eolDate) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/network-hardware/${item.assetId}`}>
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
