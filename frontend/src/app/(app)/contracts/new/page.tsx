"use client";

import { ContractForm } from "@/components/contracts/contract-form";

export default function NewContractPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">New Contract</h1>
      <p className="mt-1 text-sm text-text-secondary">Warranty, MA, Support, Subscription and other contract types.</p>
      <div className="mt-4">
        <ContractForm />
      </div>
    </div>
  );
}
