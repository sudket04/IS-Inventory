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

export interface ComputerDetailsForm {
  hostname: string; macAddress: string; cpuModel: string; ramGb: string; storageConfig: string;
  osName: string; osVersion: string; assignedDate: string; assignedToName: string; domainJoined: boolean;
}

export interface StorageDetailsForm {
  hostname: string; mgmtUrl: string; controllerCount: string; diskBayTotal: string; diskBayUsed: string;
  rawCapacityTb: string; usableCapacityTb: string; cacheGb: string; supportedProtocols: string;
  expansionShelfCount: string; firmwareVersion: string; firmwareUpdatedAt: string;
  hasDedup: boolean; hasCompression: boolean; hasSnapshot: boolean; hasReplication: boolean;
}

export interface PowerDetailsForm {
  capacityKva: string; capacityKw: string; inputPhase: string; inputVoltage: string; outputVoltage: string;
  outletCount: string; outletType: string; batteryCount: string; batteryModel: string;
  batteryInstallDate: string; batteryReplaceDue: string; runtimeMinutesFullLoad: string;
  currentLoadPercent: string; loadMeasuredAt: string; hasBypass: boolean; hasSnmpCard: boolean;
  firmwareVersion: string; coolingCapacityBtu: string; refrigerantType: string; lastServiceDate: string;
}

export interface PeripheralDetailsForm {
  connectionType: string; firmwareVersion: string; printTechnology: string; isColor: boolean; maxPaperSize: string;
  hasDuplex: boolean; hasAdf: boolean; pageCounterMono: string; pageCounterColor: string; counterReadDate: string;
  tonerModel: string; screenSizeInch: string; resolution: string; panelType: string; refreshRateHz: string;
  hasSpeaker: boolean; mountType: string;
}

export interface MobileIotDetailsForm {
  imei: string; phoneNumber: string; simProvider: string; osName: string; osVersion: string;
  isMdmEnrolled: boolean; mdmPlatform: string; hostname: string; macAddress: string; firmwareVersion: string;
  deviceProtocol: string; controllerModel: string; ioPointCount: string; resolution: string;
  hasPtz: boolean; hasIr: boolean; storageType: string; assignedToName: string; assignedDate: string;
}

// licenseKey is write-only — sent on submit, never populated from the server (see
// hasLicenseKey below for the read-side signal).
export interface SoftwareDetailsForm {
  publisher: string; version: string; edition: string; licenseType: string; licenseKey: string;
  isPerDevice: boolean; supportLevel: string; autoRenew: boolean; licensePortalUrl: string;
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
  computerDetails: {
    hostname: string | null; macAddress: string | null; cpuModel: string | null; ramGb: number | null;
    storageConfig: string | null; osName: string | null; osVersion: string | null;
    assignedDate: string | null; assignedToName: string | null; domainJoined: boolean | null;
  } | null;
  storageDetails: {
    hostname: string | null; mgmtUrl: string | null; controllerCount: number | null;
    diskBayTotal: number | null; diskBayUsed: number | null; rawCapacityTb: number | null;
    usableCapacityTb: number | null; cacheGb: number | null; supportedProtocols: string | null;
    expansionShelfCount: number | null; firmwareVersion: string | null; firmwareUpdatedAt: string | null;
    hasDedup: boolean | null; hasCompression: boolean | null; hasSnapshot: boolean | null; hasReplication: boolean | null;
  } | null;
  powerDetails: {
    capacityKva: number | null; capacityKw: number | null; inputPhase: number | null;
    inputVoltage: string | null; outputVoltage: string | null; outletCount: number | null;
    outletType: string | null; batteryCount: number | null; batteryModel: string | null;
    batteryInstallDate: string | null; batteryReplaceDue: string | null; runtimeMinutesFullLoad: number | null;
    currentLoadPercent: number | null; loadMeasuredAt: string | null; hasBypass: boolean | null;
    hasSnmpCard: boolean | null; firmwareVersion: string | null; coolingCapacityBtu: number | null;
    refrigerantType: string | null; lastServiceDate: string | null;
  } | null;
  peripheralDetails: {
    connectionType: string | null; firmwareVersion: string | null; printTechnology: string | null;
    isColor: boolean | null; maxPaperSize: string | null; hasDuplex: boolean | null; hasAdf: boolean | null;
    pageCounterMono: number | null; pageCounterColor: number | null; counterReadDate: string | null;
    tonerModel: string | null; screenSizeInch: number | null; resolution: string | null;
    panelType: string | null; refreshRateHz: number | null; hasSpeaker: boolean | null; mountType: string | null;
  } | null;
  mobileIotDetails: {
    imei: string | null; phoneNumber: string | null; simProvider: string | null; osName: string | null;
    osVersion: string | null; isMdmEnrolled: boolean | null; mdmPlatform: string | null;
    hostname: string | null; macAddress: string | null; firmwareVersion: string | null;
    deviceProtocol: string | null; controllerModel: string | null; ioPointCount: number | null;
    resolution: string | null; hasPtz: boolean | null; hasIr: boolean | null; storageType: string | null;
    assignedToName: string | null; assignedDate: string | null;
  } | null;
  softwareDetails: {
    publisher: string | null; version: string | null; edition: string | null; licenseType: string;
    licenseKey: string | null; isPerDevice: boolean | null; supportLevel: string | null;
    autoRenew: boolean | null; licensePortalUrl: string | null; hasLicenseKey: boolean;
  } | null;
}
