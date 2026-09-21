"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import type { VlanListItem } from "@/lib/vlans/types";

const ZONE_BADGE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function VlansPage() {
  const { user } = useAuth();
  const canManage = user?.roleCode === "ADMIN" || user?.roleCode === "IT_STAFF";

  const [items, setItems] = React.useState<VlanListItem[] | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch("/api/vlans");
    if (res.ok) setItems(await res.json());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: VlanListItem) {
    if (!window.confirm(`Delete VLAN "${item.vlanName}"? This fails if it still has ranges or devices linked.`)) return;
    const res = await apiFetch(`/api/vlans/${item.vlanId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      window.alert(data?.message ?? "Could not delete the VLAN.");
      return;
    }
    await load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">VLANs {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">VLAN/Subnet inventory with Site, Zone, Gateway and IP usage.</p>
        </div>
        {canManage && (
          <Link href="/vlans/new">
            <Button size="sm">+ New VLAN</Button>
          </Link>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">VLAN</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Zone</th>
              <th className="px-3 py-2 font-medium">Site</th>
              <th className="px-3 py-2 font-medium">Subnet</th>
              <th className="px-3 py-2 font-medium">Gateway</th>
              <th className="px-3 py-2 font-medium">Mode</th>
              <th className="px-3 py-2 font-medium">Usage</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-text-tertiary">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-text-tertiary">No VLANs registered.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.vlanId} className={cn(!item.isActive && "opacity-60")}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    {item.isUntagged ? "Untagged" : item.vlanNumber}
                    {item.networkLevel === "SECONDARY" && <span className="ml-1 rounded-full bg-bg-subtle px-1.5 py-0.5 text-[10px] text-text-tertiary">2nd</span>}
                  </td>
                  <td className="px-3 py-2 text-text-primary">
                    <Link href={`/vlans/${item.vlanId}`} className="hover:underline">{item.vlanName}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ZONE_BADGE_CLASSES[item.zoneColor] ?? "bg-bg-subtle text-text-tertiary")}>
                      {item.zoneName}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.siteName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-text-secondary">{item.cidr ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.gatewayIp ?? "—"}{item.gatewayAssetTag ? ` (${item.gatewayAssetTag})` : ""}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.ipAssignmentMode}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.poolCoveragePercent != null ? `${item.poolCoveragePercent}% planned` : "—"}
                    {item.staticUtilizationPercent != null && item.staticUtilizationPercent >= 90 && (
                      <AlertTriangle className="ml-1 inline size-3 text-amber-600 dark:text-amber-400" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canManage && (
                      <div className="inline-flex gap-1">
                        <Link href={`/vlans/${item.vlanId}`}>
                          <Button variant="ghost" size="icon" aria-label="Edit">
                            <Pencil className="size-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(item)}>
                          <Trash2 className="size-4" />
                        </Button>
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
