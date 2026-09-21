"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { AssetListItem, PagedResult } from "@/lib/assets/types";

const PAGE_SIZE = 25;

export default function AssetsPage() {
  const [result, setResult] = React.useState<PagedResult<AssetListItem> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Deep-links from Dashboard/Reports pass ?category=CODE and/or ?status=CODE.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("category");
    const initialStatus = params.get("status");
    if (initialCategory) setCategory(initialCategory);
    if (initialStatus) setStatus(initialStatus);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (status) params.set("status", status);

    const res = await apiFetch(`/api/assets?${params.toString()}`);
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }, [page, search, category, status]);

  React.useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleDelete(item: AssetListItem) {
    if (!window.confirm(`Delete "${item.assetTag} — ${item.name}"? This can be restored by an administrator later.`)) {
      return;
    }
    await apiFetch(`/api/assets/${item.assetId}`, { method: "DELETE" });
    await load();
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.pageSize)) : 1;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Assets {result ? `(${result.totalCount})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">Server, Network Device, Computer, Storage, Power & Cooling, Peripheral, Mobile & IoT/OT, Software License.</p>
        </div>
        <Link href="/assets/new">
          <Button size="sm">+ New Asset</Button>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search asset tag, name, serial, hostname…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        >
          <option value="">All Categories</option>
          <option value="SRV">Server</option>
          <option value="NET">Network Device</option>
          <option value="PC">Computer</option>
          <option value="STG">Storage</option>
          <option value="PWR">Power & Cooling</option>
          <option value="PER">Peripheral</option>
          <option value="IOT">Mobile & IoT/OT</option>
          <option value="SFT">Software License</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        >
          <option value="">All Statuses</option>
          <option value="IN_USE">In Use</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="UNDER_REPAIR">Under Repair</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Asset Tag</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Hostname</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">Loading…</td>
              </tr>
            ) : !result || result.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">No assets found.</td>
              </tr>
            ) : (
              result.items.map((item) => (
                <tr key={item.assetId}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{item.assetTag}</td>
                  <td className="px-3 py-2 text-text-primary">{item.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.categoryName}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.hostname ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge colorToken={item.statusColorToken} label={item.statusName} />
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.departmentName ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.ownerFullName ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`/assets/${item.assetId}`}>
                        <Button variant="ghost" size="icon" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(item)}>
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

      {result && result.totalCount > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
          <span>
            Page {result.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
