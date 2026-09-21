export interface AssetRelationshipItem {
  relationshipId: number;
  fromAssetId: number;
  toAssetId: number;
  direction: "OUTGOING" | "INCOMING";
  relationshipName: string;
  relatedAssetTag: string;
  relatedAssetName: string;
  relatedStatusCode: string;
  notes: string | null;
}

export interface RelationshipTypeOption {
  id: number;
  forwardName: string;
  inverseName: string;
}

export interface AssetRelationshipForm {
  targetAssetId: string;
  relationshipTypeId: string;
  notes: string;
}

export const emptyAssetRelationshipForm: AssetRelationshipForm = {
  targetAssetId: "",
  relationshipTypeId: "",
  notes: "",
};
