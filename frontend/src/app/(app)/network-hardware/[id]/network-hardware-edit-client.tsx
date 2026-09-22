"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { NetworkHardwareForm } from "@/components/network-hardware/network-hardware-form";
import type { NetworkDeviceDetail } from "@/lib/network-hardware/types";

export function NetworkHardwareEditClient({ assetId }: { assetId: string }) {
  const [asset, setAsset] = React.useState<NetworkDeviceDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/network-devices/${assetId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setAsset(await res.json());
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) return <div className="p-6"><p className="text-sm text-text-tertiary">Loading…</p></div>;
  if (notFound || !asset) return <div className="p-6"><p className="text-sm text-text-secondary">ไม่พบอุปกรณ์นี้ในระบบ</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit — Network Hardware</h1>
      <p className="mt-1 text-sm text-text-secondary">{asset.assetTag} — {asset.name}</p>
      <div className="mt-4 max-w-3xl">
        <NetworkHardwareForm existing={asset} />
      </div>
    </div>
  );
}
