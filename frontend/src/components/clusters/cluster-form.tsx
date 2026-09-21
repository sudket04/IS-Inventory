"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { Section, TextField, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyClusterForm, type ClusterDetail, type ClusterForm as ClusterFormState } from "@/lib/clusters/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

// Mirror CHECK constraints in docs/database/06-module-v1.2.sql §3 — values outside these
// lists are rejected by the database, not just validated client-side.
const CLUSTER_TYPES = [
  "VMWARE_HA", "VMWARE_DRS", "HYPERV_FAILOVER", "WINDOWS_FAILOVER", "PROXMOX", "NUTANIX",
  "KUBERNETES", "DB_ALWAYSON", "DB_RAC", "VEEAM_SOBR", "STORAGE_HA", "NLB", "OTHER",
];
const QUORUM_TYPES = ["NODE_MAJORITY", "WITNESS_DISK", "FILE_SHARE_WITNESS", "CLOUD_WITNESS", "NONE"];

export function ClusterForm({ existing }: { existing?: ClusterDetail }) {
  const router = useRouter();
  const locations = usePicker("locations");

  const [form, setForm] = React.useState<ClusterFormState>(() =>
    existing
      ? {
          code: existing.code,
          name: existing.name,
          clusterType: existing.clusterType,
          vendorProduct: existing.vendorProduct ?? "",
          expectedNodeCount: existing.expectedNodeCount != null ? String(existing.expectedNodeCount) : "",
          quorumType: existing.quorumType ?? "",
          managementIp: existing.managementIp ?? "",
          managementUrl: existing.managementUrl ?? "",
          siteLocationId: existing.siteLocationId != null ? String(existing.siteLocationId) : "",
          description: existing.description ?? "",
          isActive: existing.isActive,
        }
      : emptyClusterForm
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      code: form.code.trim(),
      name: form.name.trim(),
      clusterType: form.clusterType,
      vendorProduct: str(form.vendorProduct),
      expectedNodeCount: num(form.expectedNodeCount),
      quorumType: form.quorumType || null,
      managementIp: str(form.managementIp),
      managementUrl: str(form.managementUrl),
      siteLocationId: form.siteLocationId ? Number(form.siteLocationId) : null,
      description: str(form.description),
      isActive: form.isActive,
    };

    const res = existing
      ? await apiFetch(`/api/clusters/${existing.clusterId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/clusters", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      router.push("/clusters");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the cluster.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Basic Information">
        <TextField id="code" label="Code" required value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
        <TextField id="name" label="Name" required value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <EnumSelectField id="clusterType" label="Cluster Type" required options={CLUSTER_TYPES} value={form.clusterType} onChange={(v) => setForm((f) => ({ ...f, clusterType: v }))} />
        <TextField id="vendorProduct" label="Vendor / Product" value={form.vendorProduct} onChange={(v) => setForm((f) => ({ ...f, vendorProduct: v }))} />
        <TextField id="expectedNodeCount" label="Expected Node Count" type="number" value={form.expectedNodeCount} onChange={(v) => setForm((f) => ({ ...f, expectedNodeCount: v }))} />
        <EnumSelectField id="quorumType" label="Quorum Type" options={QUORUM_TYPES} value={form.quorumType} onChange={(v) => setForm((f) => ({ ...f, quorumType: v }))} />
      </Section>

      <Section title="Management">
        <TextField id="managementIp" label="Management IP" value={form.managementIp} onChange={(v) => setForm((f) => ({ ...f, managementIp: v }))} />
        <TextField id="managementUrl" label="Management URL" value={form.managementUrl} onChange={(v) => setForm((f) => ({ ...f, managementUrl: v }))} />
        <SelectField id="siteLocationId" label="Site / Location" value={form.siteLocationId} onChange={(v) => setForm((f) => ({ ...f, siteLocationId: v }))} options={locations} />
        <CheckboxField id="isActive" label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
      </Section>

      <Section title="Notes">
        <div className="col-span-full space-y-1.5">
          <textarea
            aria-label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="h-24 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/clusters")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create Cluster"}
        </Button>
      </div>
    </form>
  );
}
