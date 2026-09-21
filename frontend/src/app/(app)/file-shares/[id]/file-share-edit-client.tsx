"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { FileShareForm } from "@/components/permission-control/file-share-form";
import { FileSharePermissionsPanel } from "@/components/permission-control/file-share-permissions-panel";
import { StatusBadge } from "@/components/status-badge";
import type { FileShareDetail } from "@/lib/permission-control/types";

export function FileShareEditClient({ shareId }: { shareId: string }) {
  const [share, setShare] = React.useState<FileShareDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/file-shares/${shareId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setShare(await res.json());
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !share) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Folder not found, or you don&apos;t have permission to view this classification level.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-text-primary">{share.shareName}</h1>
        <StatusBadge colorToken={share.classificationColor} label={share.classificationName} />
      </div>
      <p className="mt-1 font-mono text-sm text-text-secondary">{share.folderPath}</p>
      <p className="text-sm text-text-tertiary">{share.serverName} ({share.assetTag})</p>

      <div className="mt-4 max-w-3xl">
        <FileShareForm existing={share} />
      </div>
      <div className="mt-4 max-w-3xl">
        <FileSharePermissionsPanel shareId={share.shareId} canEdit={share.canEdit} />
      </div>
    </div>
  );
}
