"use client";

import { AssetForm } from "@/components/assets/asset-form";

export default function NewAssetPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">New Asset</h1>
      <p className="mt-1 text-sm text-text-secondary">Server and Network Device categories only for now.</p>
      <div className="mt-4">
        <AssetForm />
      </div>
    </div>
  );
}
