"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { ContractForm } from "@/components/contracts/contract-form";
import { ContractAssetsPanel } from "@/components/contracts/contract-assets-panel";
import { AttachmentsPanel } from "@/components/assets/attachments-panel";
import type { ContractDetail } from "@/lib/contracts/types";

export function ContractEditClient({ contractId }: { contractId: string }) {
  const [contract, setContract] = React.useState<ContractDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/contracts/${contractId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setContract(await res.json());
      })
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !contract) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Contract not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit Contract</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {contract.contractNo} — {contract.contractType}
        {contract.previousContractNo ? ` · renews ${contract.previousContractNo}` : ""}
      </p>

      <div className="mt-4">
        <ContractForm existing={contract} />
      </div>
      <div className="mt-4">
        <ContractAssetsPanel contractId={contract.contractId} />
      </div>
      <div className="mt-4">
        <AttachmentsPanel owner={{ contractId: contract.contractId }} />
      </div>
    </div>
  );
}
