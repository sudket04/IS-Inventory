export interface Option {
  id: number;
  label: string;
}

export interface AssetListItem {
  assetId: number;
  assetTag: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  statusCode: string;
  statusName: string;
  statusColorToken: string;
  manufacturerName: string | null;
  model: string | null;
  serialNumber: string | null;
  hostname: string | null;
  locationName: string | null;
  departmentName: string | null;
  ownerFullName: string | null;
  updatedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ServerDetailsForm {
  hostname: string;
  macAddress: string;
  cpuModel: string;
  cpuSocketCount: string;
  ramGb: string;
  osName: string;
  osVersion: string;
  osInstallDate: string;
  lastPatchDate: string;
  parentHostAssetId: string;
}

export interface NetworkDetailsForm {
  hostname: string;
  macAddress: string;
  portSpeed: string;
  poeSupport: boolean;
  firmwareVersion: string;
  firmwareUpdatedAt: string;
  stackInfo: string;
  uplinkAssetId: string;
}

export interface AssetDetail {
  assetId: number;
  assetTag: string;
  name: string;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  manufacturerId: number | null;
  model: string | null;
  serialNumber: string | null;
  statusId: number;
  locationId: number | null;
  departmentId: number | null;
  ownerUserId: number | null;
  vendorId: number | null;
  poNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  currency: string;
  receivedDate: string | null;
  installDate: string | null;
  serviceStartDate: string | null;
  fixedAssetNo: string | null;
  serviceTag: string | null;
  systemUuid: string | null;
  costCenter: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  serverDetails: {
    hostname: string | null;
    macAddress: string | null;
    cpuModel: string | null;
    cpuSocketCount: number | null;
    ramGb: number | null;
    osName: string | null;
    osVersion: string | null;
    osInstallDate: string | null;
    lastPatchDate: string | null;
    parentHostAssetId: number | null;
  } | null;
  networkDetails: {
    hostname: string | null;
    macAddress: string | null;
    portSpeed: string | null;
    poeSupport: boolean | null;
    firmwareVersion: string | null;
    firmwareUpdatedAt: string | null;
    stackInfo: string | null;
    uplinkAssetId: number | null;
  } | null;
}
