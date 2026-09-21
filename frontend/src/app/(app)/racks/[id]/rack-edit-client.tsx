"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { RackForm } from "@/components/racks/rack-form";
import { RackElevation } from "@/components/racks/rack-elevation";
import type { RackDetail } from "@/lib/racks/types";

export function RackEditClient({ rackId }: { rackId: string }) {
  const [rack, setRack] = React.useState<RackDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/racks/${rackId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) setRack(await res.json());
      })
      .finally(() => setLoading(false));
  }, [rackId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    );
  }

  if (notFound || !rack) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Rack not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Edit Rack</h1>
      <p className="mt-1 text-sm text-text-secondary">{rack.code} — {rack.name}</p>
      <div className="mt-4">
        <RackForm existing={rack} />
      </div>
      <div className="mt-4">
        <RackElevation rackId={rack.rackId} totalU={rack.totalU} numberingDirection={rack.numberingDirection} />
      </div>
    </div>
  );
}
