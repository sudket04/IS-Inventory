"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import type { ClusterListItem } from "@/lib/clusters/types";

export default function ClustersPage() {
  const { user } = useAuth();
  const canManage = user?.roleCode === "ADMIN" || user?.roleCode === "IT_STAFF";

  const [items, setItems] = React.useState<ClusterListItem[] | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch("/api/clusters");
    if (res.ok) setItems(await res.json());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: ClusterListItem) {
    if (!window.confirm(`Delete cluster "${item.clusterName}"? This fails if it still has members or storage volumes.`)) return;
    const res = await apiFetch(`/api/clusters/${item.clusterId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      window.alert(data?.message ?? "Could not delete the cluster.");
      return;
    }
    await load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Clusters {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">VM, storage, and database clusters — members and shared storage volumes.</p>
        </div>
        {canManage && (
          <Link href="/clusters/new">
            <Button size="sm">+ New Cluster</Button>
          </Link>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Members</th>
              <th className="px-3 py-2 font-medium">Shared Storage</th>
              <th className="px-3 py-2 font-medium">Site</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-text-tertiary">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-text-tertiary">No clusters registered.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.clusterId} className={cn(!item.isActive && "opacity-60")}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{item.clusterCode}</td>
                  <td className="px-3 py-2 text-text-primary">
                    <Link href={`/clusters/${item.clusterId}`} className="hover:underline">{item.clusterName}</Link>
                    {item.isDegraded && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <AlertTriangle className="size-3" /> Degraded
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.clusterType}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.activeMembers}{item.expectedNodeCount ? ` / ${item.expectedNodeCount}` : ""}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.sharedVolumeCount > 0
                      ? `${item.sharedVolumeCount} vol · ${item.sharedCapacityGb?.toLocaleString() ?? 0} GB`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{item.siteName ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {canManage && (
                      <div className="inline-flex gap-1">
                        <Link href={`/clusters/${item.clusterId}`}>
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
