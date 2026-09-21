"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { SeatUsageItem } from "@/lib/software/types";

export default function SoftwareLicensesPage() {
  const [items, setItems] = React.useState<SeatUsageItem[] | null>(null);

  React.useEffect(() => {
    apiFetch("/api/software-licenses/seat-usage")
      .then((res) => (res.ok ? res.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Software Licenses {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">Seat usage per Software License asset, sourced from linked contracts (FR-SW-03/04).</p>
        </div>
        <Link href="/assets/new">
          <Button size="sm">+ New License</Button>
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-text-secondary">
            <tr>
              <th className="px-3 py-2 font-medium">Software</th>
              <th className="px-3 py-2 font-medium">Publisher</th>
              <th className="px-3 py-2 font-medium">License Type</th>
              <th className="px-3 py-2 font-medium">Seats</th>
              <th className="px-3 py-2 font-medium">Contract</th>
              <th className="px-3 py-2 font-medium">Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {!items ? (
              <tr><td className="px-3 py-4 text-text-tertiary" colSpan={6}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-3 py-4 text-text-tertiary" colSpan={6}>No software licenses yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.assetId} className="bg-bg-surface">
                  <td className="px-3 py-2">
                    <Link href={`/assets/${item.assetId}`} className="text-accent-text hover:underline">
                      {item.assetTag} — {item.softwareName}
                    </Link>
                    {item.version && <span className="ml-1 text-text-tertiary">v{item.version}</span>}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.publisher ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.licenseType}</td>
                  <td className="px-3 py-2">
                    <span className="text-text-primary">{item.seatsUsed} / {item.seatsPurchased}</span>
                    {item.isOverDeployed && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        <AlertTriangle className="size-3.5" /> +{item.overDeployedCount}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.currentContractNo ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.licenseEndDate ? formatDate(item.licenseEndDate) : "—"}
                    {item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30 && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        {item.daysUntilExpiry < 0 ? "Expired" : `${item.daysUntilExpiry}d left`}
                      </span>
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
