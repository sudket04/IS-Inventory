"use client";

import * as React from "react";
import Link from "next/link";
import { Search, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { FileShareListItem } from "@/lib/permission-control/types";

export default function FileSharesPage() {
  const [items, setItems] = React.useState<FileShareListItem[] | null>(null);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const res = await apiFetch(`/api/file-shares?${params.toString()}`);
    if (res.ok) setItems(await res.json());
  }, [search]);

  React.useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">File Shares {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            File Server folders with their classification and AD group permissions. Only folders your role may see are listed.
          </p>
        </div>
        <Link href="/file-shares/new">
          <Button size="sm">+ Register Folder</Button>
        </Link>
      </div>

      <div className="mt-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search share name or path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary"
          />
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Share</th>
              <th className="px-3 py-2 font-medium">Server</th>
              <th className="px-3 py-2 font-medium">Classification</th>
              <th className="px-3 py-2 font-medium">Owner Dept</th>
              <th className="px-3 py-2 font-medium">Groups</th>
              <th className="px-3 py-2 font-medium">Last Reviewed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">No folders registered yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.shareId}>
                  <td className="px-3 py-2 text-text-primary">
                    <Link href={`/file-shares/${item.shareId}`} className="hover:underline">{item.shareName}</Link>
                    <div className="font-mono text-xs text-text-tertiary">{item.folderPath}</div>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.serverName}</td>
                  <td className="px-3 py-2"><StatusBadge colorToken={item.classificationColor} label={item.classificationName} /></td>
                  <td className="px-3 py-2 text-text-secondary">{item.ownerDepartment}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      {item.totalGroupCount ?? 0}
                      {!!item.orphanGroupCount && item.orphanGroupCount > 0 && (
                        <span title={`${item.orphanGroupCount} group(s) not confirmed in AD yet`}>
                          <AlertTriangle className="size-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.lastReviewedAt ? formatDate(item.lastReviewedAt) : <span className="text-amber-600 dark:text-amber-400">Never</span>}
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
