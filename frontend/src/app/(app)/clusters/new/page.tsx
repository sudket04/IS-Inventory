"use client";

import { ClusterForm } from "@/components/clusters/cluster-form";

export default function NewClusterPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">New Cluster</h1>
      <p className="mt-1 text-sm text-text-secondary">VM, storage, or database cluster.</p>
      <div className="mt-4">
        <ClusterForm />
      </div>
    </div>
  );
}
