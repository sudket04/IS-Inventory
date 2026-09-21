export interface VlanListItem {
  vlanId: number;
  vlanNumber: number | null;
  isUntagged: boolean;
  networkLevel: string;
  vlanName: string;
  zoneCode: string;
  zoneName: string;
  zoneColor: string;
  isInternetFacing: boolean;
  cidr: string | null;
  usableAddresses: number | null;
  poolCoveragePercent: number | null;
  staticUtilizationPercent: number | null;
  gatewayIp: string | null;
  gatewayAssetTag: string | null;
  ipAssignmentMode: string;
  dhcpSourceType: string | null;
  siteId: number;
  siteName: string;
  isActive: boolean;
}

export interface VlanDetail {
  vlanId: number;
  vlanNumber: number | null;
  isUntagged: boolean;
  name: string;
  description: string | null;
  zoneId: number;
  zoneName: string;
  networkLevel: string;
  networkAddress: string;
  prefixLength: number;
  cidr: string | null;
  subnetMask: string | null;
  broadcastAddress: string | null;
  firstUsableIp: string | null;
  lastUsableIp: string | null;
  totalAddresses: number | null;
  usableAddresses: number | null;
  gatewayIp: string | null;
  gatewayDeviceRole: string | null;
  gatewayAssetId: number | null;
  gatewayAssetTag: string | null;
  gatewayInterface: string | null;
  ipAssignmentMode: string;
  dhcpSourceType: string | null;
  dhcpServerAssetId: number | null;
  dhcpServerAssetTag: string | null;
  dhcpServerNameRaw: string | null;
  dhcpRelayIp: string | null;
  dhcpLeaseHours: number | null;
  dnsPrimary: string | null;
  dnsSecondary: string | null;
  domainName: string | null;
  siteId: number;
  siteName: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface VlanForm {
  vlanNumber: string;
  isUntagged: boolean;
  name: string;
  description: string;
  zoneId: string;
  networkLevel: string;
  networkAddress: string;
  prefixLength: string;
  gatewayIp: string;
  gatewayDeviceRole: string;
  gatewayAssetId: string;
  gatewayInterface: string;
  ipAssignmentMode: string;
  dhcpSourceType: string;
  dhcpServerAssetId: string;
  dhcpServerNameRaw: string;
  dhcpRelayIp: string;
  dhcpLeaseHours: string;
  dnsPrimary: string;
  dnsSecondary: string;
  domainName: string;
  siteId: string;
  isActive: boolean;
  notes: string;
}

export const emptyVlanForm: VlanForm = {
  vlanNumber: "",
  isUntagged: false,
  name: "",
  description: "",
  zoneId: "",
  networkLevel: "PRIMARY",
  networkAddress: "",
  prefixLength: "24",
  gatewayIp: "",
  gatewayDeviceRole: "",
  gatewayAssetId: "",
  gatewayInterface: "",
  ipAssignmentMode: "STATIC_ONLY",
  dhcpSourceType: "",
  dhcpServerAssetId: "",
  dhcpServerNameRaw: "",
  dhcpRelayIp: "",
  dhcpLeaseHours: "",
  dnsPrimary: "",
  dnsSecondary: "",
  domainName: "",
  siteId: "",
  isActive: true,
  notes: "",
};

export interface VlanIpRangeItem {
  rangeId: number;
  vlanId: number;
  rangeType: string;
  startIp: string;
  endIp: string;
  dhcpSourceType: string | null;
  dhcpServerAssetTag: string | null;
  dhcpServerNameDisplay: string | null;
  description: string | null;
  isActive: boolean;
}

export interface VlanIpRangeForm {
  rangeType: string;
  startIp: string;
  endIp: string;
  dhcpSourceType: string;
  dhcpServerAssetId: string;
  description: string;
  isActive: boolean;
}

export const emptyVlanIpRangeForm: VlanIpRangeForm = {
  rangeType: "STATIC",
  startIp: "",
  endIp: "",
  dhcpSourceType: "",
  dhcpServerAssetId: "",
  description: "",
  isActive: true,
};

export interface VlanDeviceItem {
  vlanDeviceId: number;
  vlanId: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  deviceRole: string;
  interfaceName: string | null;
  isTagged: boolean | null;
  notes: string | null;
}

export interface VlanDeviceForm {
  assetId: string;
  deviceRole: string;
  interfaceName: string;
  isTagged: boolean;
  notes: string;
}

export const emptyVlanDeviceForm: VlanDeviceForm = {
  assetId: "",
  deviceRole: "TRUNK",
  interfaceName: "",
  isTagged: true,
  notes: "",
};

export interface VlanIssueItem {
  vlanId: number;
  vlanNumber: number | null;
  vlanName: string;
  issueCode: string;
  severity: string;
  issueDetail: string | null;
}
