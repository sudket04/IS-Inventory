export interface RackListItem {
  rackId: number;
  rackCode: string;
  rackName: string;
  locationPath: string | null;
  totalU: number;
  usedU: number;
  freeU: number | null;
  uUsedPercent: number | null;
  deviceCount: number;
  totalWeightKg: number | null;
  maxWeightKg: number | null;
  weightUsedPercent: number | null;
  totalPowerKw: number | null;
  maxPowerKw: number | null;
  powerUsedPercent: number | null;
  isOverWeight: boolean | null;
  isOverPower: boolean | null;
  isActive: boolean;
}

export interface RackDetail {
  rackId: number;
  locationId: number;
  locationName: string | null;
  code: string;
  name: string;
  totalU: number;
  widthMm: number | null;
  depthMm: number | null;
  maxWeightKg: number | null;
  maxPowerKw: number | null;
  numberingDirection: string;
  hasFrontDoor: boolean | null;
  hasRearDoor: boolean | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface RackForm {
  locationId: string;
  code: string;
  name: string;
  totalU: string;
  widthMm: string;
  depthMm: string;
  maxWeightKg: string;
  maxPowerKw: string;
  numberingDirection: string;
  hasFrontDoor: boolean;
  hasRearDoor: boolean;
  notes: string;
  isActive: boolean;
}

export const emptyRackForm: RackForm = {
  locationId: "",
  code: "",
  name: "",
  totalU: "42",
  widthMm: "",
  depthMm: "",
  maxWeightKg: "",
  maxPowerKw: "",
  numberingDirection: "BOTTOM_UP",
  hasFrontDoor: false,
  hasRearDoor: false,
  notes: "",
  isActive: true,
};

export interface RackMountItem {
  rackMountId: number;
  rackId: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  manufacturerName: string | null;
  modelName: string | null;
  typeName: string | null;
  categoryCode: string;
  startU: number;
  uHeight: number;
  endU: number | null;
  mountFace: string;
  orientation: string;
  statusCode: string;
  statusColor: string;
  powerDrawWatt: number | null;
  weightKg: number | null;
  mountedDate: string | null;
}

export interface RackMountForm {
  assetId: string;
  startU: string;
  uHeight: string;
  mountFace: string;
  orientation: string;
  notes: string;
}

export const emptyRackMountForm: RackMountForm = {
  assetId: "",
  startU: "",
  uHeight: "1",
  mountFace: "FRONT",
  orientation: "NORMAL",
  notes: "",
};
