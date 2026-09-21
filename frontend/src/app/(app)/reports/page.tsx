"use client";

import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { apiFetch, downloadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { ExpiringCoverageItem, LicenseComplianceItem, AssetsByStatusReport, AssetValueReport } from "@/lib/reports/types";

type TabKey = "expiring" | "license" | "status" | "value";

const TABS: { key: TabKey; label: string }[] = [
  { key: "expiring", label: "Expiring Coverage" },
  { key: "license", label: "License Compliance" },
  { key: "status", label: "Assets by Status" },
  { key: "value", label: "Asset Value (TCO)" },
];

export default function ReportsPage() {
  const [tab, setTab] = React.useState<TabKey>("expiring");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("tab");
    if (initial === "expiring" || initial === "license" || initial === "status" || initial === "value") {
      setTab(initial);
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Reports</h1>
      <p className="mt-1 text-sm text-text-secondary">Canned reports with one-click Excel export.</p>

      <div className="mt-4 flex gap-1 border-b border-border-default">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key ? "border-[var(--accent)] text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "expiring" && <ExpiringCoverageTab />}
        {tab === "license" && <LicenseComplianceTab />}
        {tab === "status" && <AssetsByStatusTab />}
        {tab === "value" && <AssetValueTab />}
      </div>
    </div>
  );
}

function ReportHeader({ title, onExport }: { title: string; onExport: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <Button size="sm" variant="outline" onClick={onExport}>
        <Download className="size-4" /> Export to Excel
      </Button>
    </div>
  );
}

function ExpiringCoverageTab() {
  const [items, setItems] = React.useState<ExpiringCoverageItem[] | null>(null);
  const [withinDays, setWithinDays] = React.useState(90);

  const load = React.useCallback(async () => {
    setItems(null);
    const res = await apiFetch(`/api/reports/expiring-coverage?withinDays=${withinDays}`);
    if (res.ok) setItems(await res.json());
  }, [withinDays]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <ReportHeader title="Assets Nearing Warranty / License Expiry" onExport={() => downloadFile(`/api/reports/expiring-coverage/export?withinDays=${withinDays}`, "expiring-coverage.xlsx")} />

      <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
        Within
        <select value={withinDays} onChange={(e) => setWithinDays(Number(e.target.value))} className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm">
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Asset Tag</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Contract</th>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Expires</th>
              <th className="px-3 py-2 font-medium">Days</th>
              <th className="px-3 py-2 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">Nothing expiring in this window.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.assetId}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                  </td>
                  <td className="px-3 py-2 text-text-primary">{item.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.categoryName}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.contractNo ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.vendorName ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{formatDate(item.coverageEndDate)}</td>
                  <td className="px-3 py-2"><SeverityBadge severity={item.severity} days={item.daysRemaining} /></td>
                  <td className="px-3 py-2 text-text-secondary">{item.ownerName ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LicenseComplianceTab() {
  const [items, setItems] = React.useState<LicenseComplianceItem[] | null>(null);

  React.useEffect(() => {
    apiFetch("/api/reports/license-compliance").then(async (res) => {
      if (res.ok) setItems(await res.json());
    });
  }, []);

  return (
    <div>
      <ReportHeader title="Software License Compliance" onExport={() => downloadFile("/api/reports/license-compliance/export", "license-compliance.xlsx")} />

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Asset Tag</th>
              <th className="px-3 py-2 font-medium">Software</th>
              <th className="px-3 py-2 font-medium">Publisher</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Purchased</th>
              <th className="px-3 py-2 font-medium">Used</th>
              <th className="px-3 py-2 font-medium">Available</th>
              <th className="px-3 py-2 font-medium">License End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">No software licenses yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.assetId} className={item.isOverDeployed ? "bg-rose-50 dark:bg-rose-950/30" : undefined}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                  </td>
                  <td className="px-3 py-2 text-text-primary">{item.softwareName}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.publisher ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.licenseType}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.seatsPurchased}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.seatsUsed}</td>
                  <td className="px-3 py-2">
                    {item.isOverDeployed ? (
                      <span className="font-medium text-rose-600 dark:text-rose-400">Over by {item.overDeployedCount}</span>
                    ) : (
                      item.seatsAvailable ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{formatDate(item.licenseEndDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetsByStatusTab() {
  const [report, setReport] = React.useState<AssetsByStatusReport | null>(null);

  React.useEffect(() => {
    apiFetch("/api/reports/assets-by-status").then(async (res) => {
      if (res.ok) setReport(await res.json());
    });
  }, []);

  return (
    <div>
      <ReportHeader title="Assets by Category × Status" onExport={() => downloadFile("/api/reports/assets-by-status/export", "assets-by-status.xlsx")} />

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!report ? (
              <tr><td colSpan={3} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : report.rows.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-4 text-center text-text-tertiary">No assets yet.</td></tr>
            ) : (
              <>
                {report.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-text-primary">
                      <Link href={`/assets?category=${row.categoryCode}&status=${row.statusCode}`} className="hover:underline">{row.categoryName}</Link>
                    </td>
                    <td className="px-3 py-2"><StatusBadge colorToken={row.colorToken} label={row.statusName} /></td>
                    <td className="px-3 py-2 text-right text-text-secondary">{row.count}</td>
                  </tr>
                ))}
                <tr className="bg-bg-subtle font-semibold">
                  <td className="px-3 py-2 text-text-primary" colSpan={2}>Total</td>
                  <td className="px-3 py-2 text-right text-text-primary">{report.grandTotal}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetValueTab() {
  const [report, setReport] = React.useState<AssetValueReport | null>(null);

  React.useEffect(() => {
    apiFetch("/api/reports/asset-value").then(async (res) => {
      if (res.ok) setReport(await res.json());
    });
  }, []);

  return (
    <div>
      <ReportHeader title="Asset Value & Total Cost of Ownership" onExport={() => downloadFile("/api/reports/asset-value/export", "asset-value.xlsx")} />

      {report && (
        <div className="mt-2 flex gap-6 text-sm text-text-secondary">
          <span><strong className="text-text-primary">{report.assetCount}</strong> assets</span>
          <span>Total purchase value: <strong className="text-text-primary">฿ {report.totalPurchaseValue.toLocaleString()}</strong></span>
          <span>Total TCO: <strong className="text-text-primary">฿ {report.totalTco.toLocaleString()}</strong></span>
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Asset Tag</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium text-right">Purchase Price</th>
              <th className="px-3 py-2 font-medium text-right">Total TCO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!report ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : report.items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">No assets yet.</td></tr>
            ) : (
              report.items.map((item) => (
                <tr key={item.assetId}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                  </td>
                  <td className="px-3 py-2 text-text-primary">{item.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.categoryName}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.departmentName ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-text-secondary">{item.purchasePrice != null ? `฿ ${item.purchasePrice.toLocaleString()}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-text-secondary">{item.totalCostOfOwnership != null ? `฿ ${item.totalCostOfOwnership.toLocaleString()}` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeverityBadge({ severity, days }: { severity: string; days: number | null }) {
  const map: Record<string, string> = {
    EXPIRED: "text-rose-600 dark:text-rose-400",
    CRITICAL: "text-amber-600 dark:text-amber-400",
    WARNING: "text-yellow-600 dark:text-yellow-400",
    NOTICE: "text-text-secondary",
    OK: "text-text-tertiary",
  };
  const cls = map[severity] ?? "text-text-secondary";
  return <span className={`text-xs font-medium ${cls}`}>{severity === "EXPIRED" ? `${Math.abs(days ?? 0)}d overdue` : `${days}d`}</span>;
}
