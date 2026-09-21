export interface ContractListItem {
  contractId: number;
  contractNo: string;
  vendorContractNo: string | null;
  contractType: string;
  vendorName: string | null;
  startDate: string;
  endDate: string;
  status: string;
  contractValue: number | null;
  currency: string;
  assetCount: number;
  autoRenew: boolean;
}

export interface ContractDetail {
  contractId: number;
  contractNo: string;
  vendorContractNo: string | null;
  contractType: string;
  vendorId: number | null;
  vendorName: string | null;
  previousContractId: number | null;
  previousContractNo: string | null;
  startDate: string;
  endDate: string;
  contractValue: number | null;
  currency: string;
  exchangeRate: number | null;
  poNumber: string | null;
  coverageHours: string | null;
  serviceType: string | null;
  slaResponseHours: number | null;
  slaResolutionHours: number | null;
  autoRenew: boolean;
  renewalNoticeDays: number | null;
  status: string;
  ownerUserId: number | null;
  ownerName: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ContractForm {
  contractNo: string;
  vendorContractNo: string;
  contractType: string;
  vendorId: string;
  previousContractId: string;
  startDate: string;
  endDate: string;
  contractValue: string;
  currency: string;
  exchangeRate: string;
  poNumber: string;
  coverageHours: string;
  serviceType: string;
  slaResponseHours: string;
  slaResolutionHours: string;
  autoRenew: boolean;
  renewalNoticeDays: string;
  status: string;
  ownerUserId: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
}

export const emptyContractForm: ContractForm = {
  contractNo: "", vendorContractNo: "", contractType: "", vendorId: "", previousContractId: "",
  startDate: "", endDate: "", contractValue: "", currency: "THB", exchangeRate: "",
  poNumber: "", coverageHours: "", serviceType: "", slaResponseHours: "", slaResolutionHours: "",
  autoRenew: false, renewalNoticeDays: "", status: "ACTIVE",
  ownerUserId: "", contactPerson: "", contactPhone: "", contactEmail: "", notes: "",
};

export interface ContractAssetItem {
  contractAssetId: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  coverageStart: string;
  coverageEnd: string;
  allocatedCost: number | null;
  seatCount: number | null;
  serviceLevelNote: string | null;
  notes: string | null;
}

export interface ContractAssetForm {
  assetId: string;
  coverageStart: string;
  coverageEnd: string;
  allocatedCost: string;
  seatCount: string;
  serviceLevelNote: string;
  notes: string;
}

export const emptyContractAssetForm: ContractAssetForm = {
  assetId: "", coverageStart: "", coverageEnd: "", allocatedCost: "", seatCount: "",
  serviceLevelNote: "", notes: "",
};
