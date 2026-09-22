"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { AvailableHardwareItem } from "@/lib/clusters/types";

/** Server Hardware not already an active Host/Node of any cluster, and not already a Server
 * List Physical entry — a given box is one thing at a time (mirrors
 * ClustersController.AvailableHardware server-side). excludeMemberId lets an edit dialog keep
 * offering the asset a Host/Node row already has. */
export function useAvailableClusterHardware(excludeMemberId?: number): AvailableHardwareItem[] {
  const [items, setItems] = React.useState<AvailableHardwareItem[]>([]);
  React.useEffect(() => {
    const qs = excludeMemberId ? `?excludeMemberId=${excludeMemberId}` : "";
    apiFetch(`/api/clusters/available-hardware${qs}`).then((res) => (res.ok ? res.json() : [])).then(setItems).catch(() => setItems([]));
  }, [excludeMemberId]);
  return items;
}
