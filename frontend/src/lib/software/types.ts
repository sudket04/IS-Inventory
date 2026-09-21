export interface SoftwareInstallationItem {
  installationId: number;
  targetAssetId: number;
  targetAssetTag: string;
  targetAssetName: string;
  installedDate: string | null;
  installedVersion: string | null;
  removedDate: string | null;
  isActive: boolean | null;
  notes: string | null;
}

export interface SoftwareInstallationForm {
  targetAssetId: string;
  installedDate: string;
  installedVersion: string;
  notes: string;
}

export const emptySoftwareInstallationForm: SoftwareInstallationForm = {
  targetAssetId: "",
  installedDate: "",
  installedVersion: "",
  notes: "",
};

export interface SeatUsageItem {
  assetId: number;
  assetTag: string;
  softwareName: string;
  publisher: string | null;
  version: string | null;
  licenseType: string;
  seatsPurchased: number;
  seatsUsed: number;
  seatsAvailable: number | null;
  isOverDeployed: boolean | null;
  overDeployedCount: number | null;
  licenseEndDate: string | null;
  daysUntilExpiry: number | null;
  currentContractNo: string | null;
  vendorName: string | null;
}
