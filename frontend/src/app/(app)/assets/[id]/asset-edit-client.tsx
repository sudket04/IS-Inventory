"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { AssetForm } from "@/components/assets/asset-form";
import { AttachmentsPanel } from "@/components/assets/attachments-panel";
import { ServerApplicationsPanel } from "@/components/assets/server-applications-panel";
import { StorageVolumesPanel } from "@/components/storage/storage-volumes-panel";
import { InstallationsPanel } from "@/components/assets/installations-panel";
import { RelationshipsPanel } from "@/components/assets/relationships-panel";
import type { AssetDetail } from "@/lib/assets/types";

const STORAGE_VOLUME_CATEGORIES = ["SRV", "STG"];

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
      {asset.categoryCode === "SRV" && (
        <div className="mt-4">
          <ServerApplicationsPanel assetId={asset.assetId} />
        </div>
      )}
      {STORAGE_VOLUME_CATEGORIES.includes(asset.categoryCode) && (
        <div className="mt-4">
          <StorageVolumesPanel owner={{ assetId: asset.assetId }} />
        </div>
      )}
      {asset.categoryCode === "SFT" && (
        <div className="mt-4">
          <InstallationsPanel softwareAssetId={asset.assetId} />
        </div>
      )}
      <div className="mt-4">
        <RelationshipsPanel assetId={asset.assetId} />
      </div>
      <div className="mt-4">
        <AttachmentsPanel owner={{ assetId: asset.assetId }} />
      </div>
    </div>
  );
}
