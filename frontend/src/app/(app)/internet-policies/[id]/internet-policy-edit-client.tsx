"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { InternetPolicyForm } from "@/components/permission-control/internet-policy-form";
import { InternetPolicyBindingsPanel } from "@/components/permission-control/internet-policy-bindings-panel";
import type { InternetPolicyDetail } from "@/lib/permission-control/types";

export function InternetPolicyEditClient({ policyId }: { policyId: string }) {
  const [policy, setPolicy] = React.useState<InternetPolicyDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/internet-policies/${policyId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setPolicy(await res.json());
      })
      .finally(() => setLoading(false));
  }, [policyId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !policy) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Policy not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">{policy.policyName}</h1>
      <p className="mt-1 font-mono text-sm text-text-secondary">{policy.policyCode}</p>

      <div className="mt-4 max-w-2xl">
        <InternetPolicyForm existing={policy} />
      </div>
      <div className="mt-4 max-w-2xl">
        <InternetPolicyBindingsPanel policyId={policy.policyId} />
      </div>
    </div>
  );
}
