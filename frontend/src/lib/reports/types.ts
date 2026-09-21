export interface ExpiringCoverageItem {
  assetId: number;
  assetTag: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  contractNo: string | null;
  vendorName: string | null;
  coverageEndDate: string | null;
  daysRemaining: number | null;
  severity: string;
  ownerName: string | null;
  locationName: string | null;
}

export interface LicenseComplianceItem {
  assetId: number;
  assetTag: string;
  softwareName: string;
  publisher: string | null;
  licenseType: string;
  seatsPurchased: number;
  seatsUsed: number;
  seatsAvailable: number | null;
  isOverDeployed: boolean;
  overDeployedCount: number | null;
  licenseEndDate: string | null;
  currentContractNo: string | null;
  vendorName: string | null;
}

export interface AssetsByStatusRow {
  categoryCode: string;
  categoryName: string;
  statusCode: string;
  statusName: string;
  colorToken: string;
  count: number;
}

export interface AssetsByStatusReport {
  rows: AssetsByStatusRow[];
  grandTotal: number;
}

export interface AssetValueItem {
  assetId: number;
  assetTag: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  departmentName: string | null;
  locationName: string | null;
  purchasePrice: number | null;
  currency: string;
  totalContractCost: number;
  totalCostOfOwnership: number | null;
}

export interface AssetValueReport {
  items: AssetValueItem[];
  totalPurchaseValue: number;
  totalTco: number;
  assetCount: number;
}
