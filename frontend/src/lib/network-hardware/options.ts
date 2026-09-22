"use client";

import { useAssetTypes } from "@/lib/server-domain/options";
import { usePicker } from "@/lib/assets/options";
import type { Option } from "@/lib/assets/types";

/** Category/Sub-category cascade for Network Hardware — reuses the same asset_types NET_*
 * taxonomy already shared with Assets/Dashboard/Reports (api/pickers/asset-types), so device
 * classification stays in one place instead of a parallel lookup. */
export function useNetworkDeviceTypes() {
  return useAssetTypes("NET");
}

export function useUplinkAssets(excludeAssetId?: number): Option[] {
  const path = excludeAssetId ? `network-devices?excludeAssetId=${excludeAssetId}` : "network-devices";
  return usePicker(path);
}
