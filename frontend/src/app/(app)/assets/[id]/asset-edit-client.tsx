"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { AssetForm } from "@/components/assets/asset-form";
import type { AssetDetail } from "@/lib/assets/types";

export function AssetEditClient({ assetId }: { assetId: string }) {
  const [asset, setAsset] = React.useState<AssetDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/assets/${assetId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setAsset(await res.json());
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Asset not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit Asset</h1>
      <p className="mt-1 text-sm text-text-secondary">{asset.assetTag} — {asset.name}</p>
      <div className="mt-4">
        <AssetForm existing={asset} />
      </div>
    </div>
  );
}
