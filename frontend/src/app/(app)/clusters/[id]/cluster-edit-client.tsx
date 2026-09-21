"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { ClusterForm } from "@/components/clusters/cluster-form";
import { ClusterMembersPanel } from "@/components/clusters/cluster-members-panel";
import { StorageVolumesPanel } from "@/components/storage/storage-volumes-panel";
import type { ClusterDetail } from "@/lib/clusters/types";

export function ClusterEditClient({ clusterId }: { clusterId: string }) {
  const [cluster, setCluster] = React.useState<ClusterDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/clusters/${clusterId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setCluster(await res.json());
      })
      .finally(() => setLoading(false));
  }, [clusterId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !cluster) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Cluster not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit Cluster</h1>
      <p className="mt-1 text-sm text-text-secondary">{cluster.code} — {cluster.name}</p>
      <div className="mt-4">
        <ClusterForm existing={cluster} />
      </div>
      <div className="mt-4">
        <ClusterMembersPanel clusterId={cluster.clusterId} />
      </div>
      <div className="mt-4">
        <StorageVolumesPanel owner={{ clusterId: cluster.clusterId }} />
      </div>
    </div>
  );
}
