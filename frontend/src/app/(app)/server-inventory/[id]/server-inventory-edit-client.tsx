"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ServerInventoryForm } from "@/components/server-domain/server-inventory-form";
import type { ServerInventoryDetail } from "@/lib/server-domain/types";

export function ServerInventoryEditClient({ assetId }: { assetId: string }) {
  const [asset, setAsset] = React.useState<ServerInventoryDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/server-inventory/${assetId}`)
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
  if (notFound || !asset) return <div className="p-6"><p className="text-sm text-text-secondary">ไม่พบ Asset นี้ในระบบ</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit — Server Inventory</h1>
      <p className="mt-1 text-sm text-text-secondary">{asset.assetTag} — {asset.name}</p>
      {asset.categoryCode === "SRV" && (
        <p className="mt-1 text-sm">
          {asset.inUseByServerList ? (
            <Link href={`/server-list/${asset.assetId}`} className="text-accent-text hover:underline">→ ดูใน Server List</Link>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">ยังไม่ได้เพิ่มเข้า Server List — ไปที่ Server List &gt; + New เพื่อเลือกเครื่องนี้</span>
          )}
        </p>
      )}
      <div className="mt-4 max-w-3xl">
        <ServerInventoryForm existing={asset} />
      </div>
    </div>
  );
}
