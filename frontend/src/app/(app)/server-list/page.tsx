"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { ServerListItem } from "@/lib/server-domain/types";

export default function ServerListListPage() {
  const [items, setItems] = React.useState<ServerListItem[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [hostingType, setHostingType] = React.useState("");

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (hostingType) params.set("hostingType", hostingType);
    const res = await apiFetch(`/api/server-list?${params.toString()}`);
    if (res.ok) setItems(await res.json());
  }, [search, hostingType]);

  React.useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Server List {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">มุมมอง Workload/OS ของ Server — Virtual และ Physical</p>
        </div>
        <Link href="/server-list/new">
          <Button size="sm">+ New</Button>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input type="search" placeholder="Search name, hostname, FQDN…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary" />
        </div>
        <select value={hostingType} onChange={(e) => setHostingType(e.target.value)}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
          <option value="">All</option>
          <option value="Virtual">Virtual</option>
          <option value="Physical">Physical</option>
        </select>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">System Name</th>
              <th className="px-3 py-2 font-medium">Cluster / Hardware</th>
              <th className="px-3 py-2 font-medium">Environment</th>
              <th className="px-3 py-2 font-medium">Criticality</th>
              <th className="px-3 py-2 font-medium">OS</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={9} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-4 text-center text-text-tertiary">No servers yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.assetId}>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${item.isVirtual ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                      {item.isVirtual ? "Virtual" : "Physical"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{item.assetTag} — {item.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.isVirtual ? (item.clusterName ?? "—") : (item.hardwareLabel ?? "—")}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.environment ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.criticality ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{[item.osTypeName, item.osVersionName].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-3 py-2">
                    {item.serverStatusName ? <StatusBadge colorToken={item.serverStatusColorToken ?? "slate"} label={item.serverStatusName} /> : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.ownerFullName ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/server-list/${item.assetId}`}>
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
