"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ShieldAlert, Wrench, Boxes, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDateTime } from "@/lib/format";
import { colorTokenHex } from "@/components/status-badge";
import { NavIcon } from "@/components/layout/nav-icon";
import type { DashboardSummary } from "@/lib/dashboard/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch("/api/dashboard/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Welcome back, {user?.fullName}</h1>
      <p className="mt-1 text-sm text-text-secondary">Signed in as {user?.roleName}.</p>

      {loading || !summary ? (
        <p className="mt-6 text-sm text-text-tertiary">Loading dashboard…</p>
      ) : (
        <div className="mt-4 space-y-6">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">⚡ Action Required</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ActionCard
                icon={<AlertTriangle className="size-5" />}
                tone="rose"
                value={summary.actionRequired.expiredCoverageCount}
                label="Expired Coverage"
                href="/reports?tab=expiring"
              />
              <ActionCard
                icon={<Clock className="size-5" />}
                tone="amber"
                value={summary.actionRequired.expiringWithin30DaysCount}
                label="Expiring ≤ 30 days"
                href="/reports?tab=expiring"
              />
              <ActionCard
                icon={<ShieldAlert className="size-5" />}
                tone="yellow"
                value={summary.actionRequired.licenseOverDeployedCount}
                label="License Over-deployed"
                href="/reports?tab=license"
              />
              <ActionCard
                icon={<Wrench className="size-5" />}
                tone="sky"
                value={summary.actionRequired.underRepairCount}
                label="Under Repair"
                href="/assets?status=UNDER_REPAIR"
              />
            </div>
          </section>

          {summary.expiringSoon.length > 0 && (
            <section className="rounded-md border border-border-default bg-bg-surface">
              <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
                <h2 className="text-sm font-semibold text-text-primary">Expiring Soon (Next 90 Days)</h2>
                <Link href="/reports?tab=expiring" className="text-xs text-[var(--accent-text)] hover:underline">
                  View All →
                </Link>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="px-3 py-2 font-medium">Asset Tag</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Expires</th>
                    <th className="px-3 py-2 font-medium">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {summary.expiringSoon.map((item) => (
                    <tr key={item.assetId}>
                      <td className="px-3 py-2 font-mono text-xs text-text-primary">
                        <Link href={`/assets/${item.assetId}`} className="hover:underline">{item.assetTag}</Link>
                      </td>
                      <td className="px-3 py-2 text-text-primary">{item.name}</td>
                      <td className="px-3 py-2 text-text-secondary">{item.categoryName}</td>
                      <td className="px-3 py-2 text-text-secondary">{item.coverageEndDate.split("-").reverse().join("/")}</td>
                      <td className="px-3 py-2">
                        <DaysBadge days={item.daysRemaining} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">📊 Overview</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile icon={<Boxes className="size-5" />} value={summary.overview.totalAssets.toLocaleString()} label="Total Assets" sub={`▲ ${summary.overview.newThisMonth} this month`} href="/assets" />
              <StatTile value={summary.overview.inUseCount.toLocaleString()} label="In Use" sub={percentLabel(summary.overview.inUseCount, summary.overview.totalAssets)} href="/assets?status=IN_USE" />
              <StatTile value={summary.overview.inStockCount.toLocaleString()} label="In Stock" sub={percentLabel(summary.overview.inStockCount, summary.overview.totalAssets)} href="/assets?status=IN_STOCK" />
              <StatTile icon={<TrendingUp className="size-5" />} value={formatCurrency(summary.overview.totalValue)} label="Total Purchase Value" href="/reports?tab=value" />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-md border border-border-default bg-bg-surface p-4">
              <h2 className="text-sm font-semibold text-text-primary">Assets by Category</h2>
              <div className="mt-3 space-y-2">
                {summary.byCategory.map((c) => (
                  <CategoryBar key={c.code} item={c} max={Math.max(...summary.byCategory.map((x) => x.count), 1)} />
                ))}
                {summary.byCategory.length === 0 && <p className="text-sm text-text-tertiary">No assets yet.</p>}
              </div>
            </section>

            <section className="rounded-md border border-border-default bg-bg-surface p-4">
              <h2 className="text-sm font-semibold text-text-primary">Assets by Status</h2>
              <StatusDonut items={summary.byStatus} />
            </section>
          </div>

          {summary.recentActivity.length > 0 && (
            <section className="rounded-md border border-border-default bg-bg-surface">
              <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
                <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
                <Link href="/audit-logs" className="text-xs text-[var(--accent-text)] hover:underline">
                  View Audit Log →
                </Link>
              </div>
              <ul className="divide-y divide-border-default text-sm">
                {summary.recentActivity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-32 shrink-0 text-xs text-text-tertiary">{formatDateTime(a.occurredAt)}</span>
                    <span className="w-24 shrink-0 text-text-secondary">{a.usernameSnapshot ?? "—"}</span>
                    <span className="w-20 shrink-0 font-medium text-text-primary">{a.action}</span>
                    <span className="text-text-secondary">{a.entityLabel ?? a.entityType ?? ""}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function percentLabel(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `฿ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿ ${(value / 1_000).toFixed(1)}K`;
  return `฿ ${value.toLocaleString()}`;
}

const ACTION_TONE_CLASSES: Record<string, string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
};

function ActionCard({ icon, tone, value, label, href }: { icon: React.ReactNode; tone: string; value: number; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-1 rounded-md border p-3 transition-opacity hover:opacity-80 ${ACTION_TONE_CLASSES[tone] ?? ACTION_TONE_CLASSES.sky}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function StatTile({ icon, value, label, sub, href }: { icon?: React.ReactNode; value: string; label: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-md border border-border-default bg-bg-surface p-3 hover:bg-bg-subtle">
      <div className="flex items-center gap-2 text-text-primary">
        {icon}
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
      {sub && <span className="text-xs text-text-tertiary">{sub}</span>}
    </Link>
  );
}

function DaysBadge({ days }: { days: number }) {
  const tone = days < 0 ? "text-rose-600 dark:text-rose-400" : days <= 30 ? "text-amber-600 dark:text-amber-400" : days <= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-text-secondary";
  return <span className={`text-xs font-medium ${tone}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}</span>;
}

function CategoryBar({ item, max }: { item: { code: string; name: string; iconName: string | null; count: number }; max: number }) {
  const width = Math.max((item.count / max) * 100, 3);
  return (
    <Link href={`/assets?category=${item.code}`} className="flex items-center gap-2 text-sm hover:opacity-80">
      <span className="flex w-32 shrink-0 items-center gap-1.5 text-text-secondary">
        <NavIcon name={item.iconName ?? "layout-dashboard"} className="size-3.5" />
        {item.name}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded-sm bg-bg-subtle">
        <div className="h-full rounded-sm bg-[var(--accent)]" style={{ width: `${width}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-text-tertiary">{item.count}</span>
    </Link>
  );
}

function StatusDonut({ items }: { items: { code: string; name: string; colorToken: string; count: number }[] }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return <p className="mt-3 text-sm text-text-tertiary">No assets yet.</p>;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="mt-3 flex items-center gap-4">
      <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0 -rotate-90">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--bg-subtle)" strokeWidth="14" />
        {items.map((item) => {
          const dash = (item.count / total) * circumference;
          const circle = (
            <circle
              key={item.code}
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke={colorTokenHex(item.colorToken)}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.code}>
            <Link href={`/assets?status=${item.code}`} className="flex items-center gap-2 hover:underline">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: colorTokenHex(item.colorToken) }} />
              <span className="text-text-secondary">{item.name}</span>
              <span className="text-xs text-text-tertiary">{percentLabel(item.count, total)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
