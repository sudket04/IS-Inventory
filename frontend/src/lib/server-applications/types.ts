export interface ServerApplicationListItem {
  applicationId: number;
  assetId: number;
  serverTypeId: number | null;
  serverTypeName: string | null;
  applicationName: string;
  portNumber: string | null;
  linkUrl: string | null;
  inchargeName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  siteId: number;
  siteName: string;
  isActive: boolean;
  notes: string | null;
}

export interface ServerApplicationForm {
  serverTypeId: string;
  applicationName: string;
  portNumber: string;
  linkUrl: string;
  inchargeName: string;
  departmentId: string;
  siteId: string;
  isActive: boolean;
  notes: string;
}

export const emptyServerApplicationForm: ServerApplicationForm = {
  serverTypeId: "",
  applicationName: "",
  portNumber: "",
  linkUrl: "",
  inchargeName: "",
  departmentId: "",
  siteId: "",
  isActive: true,
  notes: "",
};
