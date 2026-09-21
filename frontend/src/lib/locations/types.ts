export interface LocationTreeNode {
  locationId: number;
  parentLocationId: number | null;
  code: string;
  name: string;
  locationType: string;
  address: string | null;
  sortOrder: number;
  isActive: boolean;
  children: LocationTreeNode[];
}

export interface LocationForm {
  parentLocationId: string;
  code: string;
  name: string;
  locationType: string;
  address: string;
  sortOrder: string;
  isActive: boolean;
}

export const emptyLocationForm: LocationForm = {
  parentLocationId: "",
  code: "",
  name: "",
  locationType: "",
  address: "",
  sortOrder: "0",
  isActive: true,
};
