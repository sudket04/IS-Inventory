export interface StorageVolumeListItem {
  volumeId: number;
  assetId: number | null;
  clusterId: number | null;
  providerAssetId: number | null;
  providerAssetTag: string | null;
  volumeName: string;
  volumeType: string;
  storageProtocol: string | null;
  raidLevel: string | null;
  diskType: string | null;
  capacityGb: number;
  usedGb: number | null;
  freeGb: number | null;
  usedPercent: number | null;
  lastMeasuredAt: string | null;
  mountPath: string | null;
  isShared: boolean;
  isThinProvisioned: boolean | null;
  encryptionEnabled: boolean | null;
  immutabilityDays: number | null;
  retentionDays: number | null;
  dedupRatio: number | null;
  notes: string | null;
  isActive: boolean;
}

export interface StorageVolumeForm {
  volumeName: string;
  volumeType: string;
  storageProtocol: string;
  raidLevel: string;
  diskType: string;
  capacityGb: string;
  usedGb: string;
  lastMeasuredAt: string;
  mountPath: string;
  providerAssetId: string;
  isThinProvisioned: boolean;
  encryptionEnabled: boolean;
  immutabilityDays: string;
  retentionDays: string;
  dedupRatio: string;
  notes: string;
  isActive: boolean;
}

export const emptyStorageVolumeForm: StorageVolumeForm = {
  volumeName: "",
  volumeType: "",
  storageProtocol: "",
  raidLevel: "",
  diskType: "",
  capacityGb: "",
  usedGb: "",
  lastMeasuredAt: "",
  mountPath: "",
  providerAssetId: "",
  isThinProvisioned: false,
  encryptionEnabled: false,
  immutabilityDays: "",
  retentionDays: "",
  dedupRatio: "",
  notes: "",
  isActive: true,
};
