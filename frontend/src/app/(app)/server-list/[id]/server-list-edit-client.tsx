"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ServerListForm } from "@/components/server-domain/server-list-form";
import { ServerApplicationsPanel } from "@/components/assets/server-applications-panel";
import type { ServerListDetail } from "@/lib/server-domain/types";

export function ServerListEditClient({ assetId }: { assetId: string }) {
  const [detail, setDetail] = React.useState<ServerListDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/server-list/${assetId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setDetail(await res.json());
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) return <div className="p-6"><p className="text-sm text-text-tertiary">Loading…</p></div>;
  if (notFound || !detail) return <div className="p-6"><p className="text-sm text-text-secondary">ไม่พบ Server นี้ในระบบ</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit — Server List</h1>
      <p className="mt-1 text-sm text-text-secondary">{detail.assetTag} — {detail.name}</p>
      {!detail.isVirtual && (
        <p className="mt-1 text-sm">
          <Link href={`/server-inventory/${detail.assetId}`} className="text-accent-text hover:underline">→ แก้ไขข้อมูล Hardware (CPU/Memory/Storage) ที่ Server Inventory</Link>
        </p>
      )}
      <div className="mt-4 max-w-3xl">
        <ServerListForm existing={detail} />
      </div>
      <div className="mt-4 max-w-3xl">
        <ServerApplicationsPanel assetId={detail.assetId} />
      </div>
    </div>
  );
}
