"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ContractListItem } from "@/lib/contracts/types";

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  DRAFT: "bg-bg-subtle text-text-tertiary",
  EXPIRED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  CANCELLED: "bg-bg-subtle text-text-tertiary",
  SUPERSEDED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export default function ContractsPage() {
  const [result, setResult] = React.useState<PagedResult<ContractListItem> | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    const res = await apiFetch(`/api/contracts?${params.toString()}`);
    if (res.ok) setResult(await res.json());
  }, [search, status, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: ContractListItem) {
    if (!window.confirm(`Delete contract "${item.contractNo}"?`)) return;
    const res = await apiFetch(`/api/contracts/${item.contractId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      window.alert(data?.message ?? "Could not delete this contract.");
      return;
    }
    await load();
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.pageSize)) : 1;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Contracts {result ? `(${result.totalCount})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">Warranty, MA, Support, Subscription and other contracts — single-asset or multi-asset, with renewal chains.</p>
        </div>
        <Link href="/contracts/new">
          <Button size="sm">+ New Contract</Button>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search contract no, vendor…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="SUPERSEDED">Superseded</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-text-secondary">
            <tr>
              <th className="px-3 py-2 font-medium">Contract No.</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Assets</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {!result ? (
              <tr><td className="px-3 py-4 text-text-tertiary" colSpan={8}>Loading…</td></tr>
            ) : result.items.length === 0 ? (
              <tr><td className="px-3 py-4 text-text-tertiary" colSpan={8}>No contracts yet.</td></tr>
            ) : (
              result.items.map((item) => (
                <tr key={item.contractId} className="bg-bg-surface">
                  <td className="px-3 py-2">
                    <Link href={`/contracts/${item.contractId}`} className="text-accent-text hover:underline">
                      {item.contractNo}
                    </Link>
                    {item.autoRenew && <span className="ml-2 text-xs text-text-tertiary">Auto-renew</span>}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.contractType}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.vendorName ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{formatDate(item.startDate)} – {formatDate(item.endDate)}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.contractValue != null ? `${item.contractValue.toLocaleString()} ${item.currency}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.assetCount}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status] ?? "bg-bg-subtle text-text-tertiary"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
