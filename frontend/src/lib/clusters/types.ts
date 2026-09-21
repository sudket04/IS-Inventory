export interface ClusterListItem {
  clusterId: number;
  clusterCode: string;
  clusterName: string;
  clusterType: string;
  vendorProduct: string | null;
  managementIp: string | null;
  expectedNodeCount: number | null;
  activeMembers: number;
  isDegraded: boolean | null;
  memberList: string | null;
  sharedVolumeCount: number;
  sharedCapacityGb: number | null;
  sharedUsedGb: number | null;
  sharedUsedPercent: number | null;
  siteName: string | null;
  isActive: boolean;
}

export interface ClusterDetail {
  clusterId: number;
  code: string;
  name: string;
  clusterType: string;
  vendorProduct: string | null;
  expectedNodeCount: number | null;
  quorumType: string | null;
  managementIp: string | null;
  managementUrl: string | null;
  siteLocationId: number | null;
  siteLocationName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ClusterForm {
  code: string;
  name: string;
  clusterType: string;
  vendorProduct: string;
  expectedNodeCount: string;
  quorumType: string;
  managementIp: string;
  managementUrl: string;
  siteLocationId: string;
  description: string;
  isActive: boolean;
}

export const emptyClusterForm: ClusterForm = {
  code: "",
  name: "",
  clusterType: "",
  vendorProduct: "",
  expectedNodeCount: "",
  quorumType: "",
  managementIp: "",
  managementUrl: "",
  siteLocationId: "",
  description: "",
  isActive: true,
};

export interface ClusterMemberItem {
  memberId: number;
  clusterId: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  memberRole: string;
  nodePriority: number | null;
  joinedDate: string | null;
  leftDate: string | null;
  isActive: boolean | null;
  notes: string | null;
}

export interface ClusterMemberForm {
  assetId: string;
  memberRole: string;
  nodePriority: string;
  notes: string;
}

export const emptyClusterMemberForm: ClusterMemberForm = {
  assetId: "",
  memberRole: "",
  nodePriority: "",
  notes: "",
};
