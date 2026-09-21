"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { VlanForm } from "@/components/vlans/vlan-form";
import { VlanIpRangesPanel } from "@/components/vlans/vlan-ip-ranges-panel";
import { VlanDevicesPanel } from "@/components/vlans/vlan-devices-panel";
import { VlanIssuesPanel } from "@/components/vlans/vlan-issues-panel";
import type { VlanDetail } from "@/lib/vlans/types";

export function VlanEditClient({ vlanId }: { vlanId: string }) {
  const [vlan, setVlan] = React.useState<VlanDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/vlans/${vlanId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setVlan(await res.json());
      })
      .finally(() => setLoading(false));
  }, [vlanId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !vlan) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">VLAN not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit VLAN</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {vlan.isUntagged ? "Untagged" : `VLAN ${vlan.vlanNumber}`} — {vlan.name} ({vlan.cidr})
      </p>

      <div className="mt-4">
        <VlanIssuesPanel vlanId={vlan.vlanId} />
      </div>

      <div className="mt-4">
        <VlanForm existing={vlan} />
      </div>
      <div className="mt-4">
        <VlanIpRangesPanel vlanId={vlan.vlanId} />
      </div>
      <div className="mt-4">
        <VlanDevicesPanel vlanId={vlan.vlanId} />
      </div>
    </div>
  );
}
