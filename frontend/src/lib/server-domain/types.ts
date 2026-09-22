export interface CpuItem { id: number; cpuModel: string; coreCount: number }
export interface CpuRequest { cpuModel: string; coreCount: number }

export interface MemoryItem { id: number; capacityGb: number; memoryType: string | null }
export interface MemoryRequest { capacityGb: number; memoryType: string | null }

export interface DiskItem { id: number; diskLabel: string | null; capacityGb: number; diskType: string | null }
export interface DiskRequest { diskLabel: string | null; capacityGb: number; diskType: string | null }

export interface HardwareSummary { cpuSocketCount: number; cpuTotalCores: number; totalRamGb: number; totalStorageGb: number }

// ---------- Server Inventory (Hardware) ----------

export interface ServerInventoryListItem {
  assetId: number; assetTag: string; name: string; categoryCode: string; categoryName: string;
  assetTypeName: string | null; manufacturerName: string | null; model: string | null; serialNumber: string | null;
  statusCode: string; statusName: string; statusColorToken: string;
  locationName: string | null; purchaseDate: string | null; fixedAssetNo: string | null; warrantyUntil: string | null;
  costCenter: string | null; inUseByServerList: boolean;
}

export interface UsedWithItem { type: "cluster" | "server"; id: number; label: string }

export interface ServerInventoryDetail {
  assetId: number; assetTag: string; name: string; categoryId: number; categoryCode: string; categoryName: string;
  assetTypeId: number | null; assetTypeName: string | null;
  manufacturerId: number | null; model: string | null; serialNumber: string | null;
  statusId: number; locationId: number | null; departmentId: number | null; ownerUserId: number | null; vendorId: number | null;
  poNumber: string | null; purchaseDate: string | null; purchasePrice: number | null; currency: string;
  receivedDate: string | null; installDate: string | null; serviceStartDate: string | null;
  fixedAssetNo: string | null; serviceTag: string | null; systemUuid: string | null; costCenter: string | null; notes: string | null;
  warrantyUntil: string | null; createdAt: string; updatedAt: string | null;
  hostname: string | null; macAddress: string | null; osInstallDate: string | null; lastPatchDate: string | null; criticality: string | null;
  hardwareSummary: HardwareSummary | null; cpus: CpuItem[] | null; memoryModules: MemoryItem[] | null; localDisks: DiskItem[] | null;
  storageHostname: string | null; storageMgmtUrl: string | null; controllerCount: number | null; diskBayTotal: number | null; diskBayUsed: number | null;
  rawCapacityTb: number | null; usableCapacityTb: number | null; cacheGb: number | null; supportedProtocols: string | null;
  hasDedup: boolean | null; hasCompression: boolean | null; hasSnapshot: boolean | null; hasReplication: boolean | null;
  usedWith: UsedWithItem[] | null;
  inUseByServerList: boolean;
}

export interface ServerInventoryRequest {
  categoryId: number; assetTypeId: number; name: string; manufacturerId: number | null; model: string | null; serialNumber: string | null;
  statusId: number; locationId: number | null; departmentId: number | null; ownerUserId: number | null; vendorId: number | null;
  poNumber: string | null; purchaseDate: string | null; purchasePrice: number | null; currency: string;
  receivedDate: string | null; installDate: string | null; serviceStartDate: string | null;
  fixedAssetNo: string | null; serviceTag: string | null; systemUuid: string | null; costCenter: string | null; notes: string | null;
  hostname: string | null; macAddress: string | null; osInstallDate: string | null; lastPatchDate: string | null; criticality: string | null;
  cpus: CpuRequest[] | null; memoryModules: MemoryRequest[] | null; localDisks: DiskRequest[] | null;
  storageMgmtUrl: string | null; controllerCount: number | null; diskBayTotal: number | null; diskBayUsed: number | null;
  rawCapacityTb: number | null; usableCapacityTb: number | null; cacheGb: number | null; supportedProtocols: string | null;
  hasDedup: boolean | null; hasCompression: boolean | null; hasSnapshot: boolean | null; hasReplication: boolean | null;
}

// ---------- Server List ----------

export interface ServerListItem {
  assetId: number; assetTag: string; name: string; isVirtual: boolean;
  clusterName: string | null; hardwareLabel: string | null;
  environment: string | null; criticality: string | null;
  serverStatusCode: string | null; serverStatusName: string | null; serverStatusColorToken: string | null;
  osTypeName: string | null; osVersionName: string | null; ownerFullName: string | null; updatedAt: string | null;
}

export interface ServerListDetail {
  assetId: number; assetTag: string; name: string; isVirtual: boolean; assetTypeId: number; assetTypeName: string;
  statusId: number; locationId: number | null; departmentId: number | null; ownerUserId: number | null; notes: string | null;
  hostname: string | null; macAddress: string | null; osInstallDate: string | null; lastPatchDate: string | null;
  clusterId: number | null; clusterName: string | null; systemGroup: string | null; fqdn: string | null;
  serverZoneId: number | null; serverZoneName: string | null; environment: string | null; criticality: string | null;
  serverStatusId: number | null; serverStatusName: string | null; osTypeId: number | null; osTypeName: string | null;
  osVersionId: number | null; osVersionName: string | null;
  primaryIpAddress: string | null; managementIpAddress: string | null;
  hardwareSummary: HardwareSummary | null; cpus: CpuItem[]; memoryModules: MemoryItem[]; localDisks: DiskItem[];
  createdAt: string; updatedAt: string | null;
}

export interface ServerListCreateRequest {
  isVirtual: boolean; hardwareAssetId: number | null; name: string | null;
  statusId: number | null; locationId: number | null; departmentId: number | null; ownerUserId: number | null; notes: string | null;
  hostname: string | null; macAddress: string | null; osInstallDate: string | null; lastPatchDate: string | null;
  clusterId: number | null; systemGroup: string | null; fqdn: string | null; serverZoneId: number | null;
  environment: string; criticality: string | null; serverStatusId: number; osTypeId: number | null; osVersionId: number | null;
  primaryIpAddress: string | null; managementIpAddress: string | null;
  cpus: CpuRequest[] | null; memoryModules: MemoryRequest[] | null; localDisks: DiskRequest[] | null;
}

export type ServerListUpdateRequest = Omit<ServerListCreateRequest, "isVirtual" | "hardwareAssetId">;

export interface AvailableHardwareItem {
  assetId: number; assetTag: string; name: string; manufacturerName: string | null; model: string | null; serialNumber: string | null;
}

export const ENVIRONMENT_OPTIONS = ["PRODUCTION", "UAT", "DEVELOPMENT", "DR"] as const;
export const CRITICALITY_OPTIONS = [
  { value: "TIER1", label: "Tier 1 (High)" },
  { value: "TIER2", label: "Tier 2 (Medium)" },
  { value: "TIER3", label: "Tier 3 (Low)" },
];
export const DISK_TYPE_OPTIONS = ["SSD", "HDD", "NVME", "VIRTUAL_DISK", "OTHER"] as const;
export const MEMORY_TYPE_OPTIONS = ["DDR3", "DDR4", "DDR5", "OTHER"] as const;
