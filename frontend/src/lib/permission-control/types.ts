// --- File Shares ---

export interface FileShareListItem {
  shareId: number;
  shareName: string;
  folderPath: string;
  assetTag: string;
  serverName: string;
  classificationCode: string;
  classificationName: string;
  sensitivityRank: number;
  classificationColor: string;
  ownerDepartment: string;
  ownerUserName: string | null;
  totalGroupCount: number | null;
  orphanGroupCount: number | null;
  lastReviewedAt: string | null;
  daysSinceReview: number | null;
}

export interface FileShareDetail {
  shareId: number;
  assetId: number;
  assetTag: string;
  serverName: string;
  shareName: string;
  folderPath: string;
  classificationId: number;
  classificationCode: string;
  classificationName: string;
  sensitivityRank: number;
  classificationColor: string;
  ownerDepartmentId: number;
  ownerDepartment: string;
  ownerUserId: number | null;
  ownerUserName: string | null;
  businessPurpose: string | null;
  fsrmQuotaTemplate: string | null;
  isQuotaManaged: boolean;
  lastReviewedAt: string | null;
  lastReviewedBy: number | null;
  reviewNote: string | null;
  notes: string | null;
  canEdit: boolean;
}

export interface FileShareForm {
  assetId: number | "";
  shareName: string;
  folderPath: string;
  classificationId: number | "";
  ownerDepartmentId: number | "";
  ownerUserId: number | "";
  businessPurpose: string;
  fsrmQuotaTemplate: string;
  isQuotaManaged: boolean;
  lastReviewedAt: string;
  reviewNote: string;
  notes: string;
}

export const emptyFileShareForm: FileShareForm = {
  assetId: "",
  shareName: "",
  folderPath: "",
  classificationId: "",
  ownerDepartmentId: "",
  ownerUserId: "",
  businessPurpose: "",
  fsrmQuotaTemplate: "",
  isQuotaManaged: true,
  lastReviewedAt: "",
  reviewNote: "",
  notes: "",
};

export interface FileSharePermissionItem {
  permissionId: number;
  adGroupId: number | null;
  adGroupName: string;
  accessLevelCode: string;
  accessLevelName: string;
  colorToken: string;
  grantedReason: string | null;
  requestReference: string | null;
  isOrphanGroup: boolean;
}

export interface PermissionVersionItem {
  versionNo: number | null;
  adGroupName: string;
  accessLevelName: string;
  previousAccessLevelName: string | null;
  changeAction: string;
  changeActionTh: string;
  changedByName: string | null;
  changedAtUtc: string;
  isCurrent: number;
}

// --- Internet Policies ---

export interface InternetPolicyListItem {
  policyId: number;
  policyCode: string;
  policyName: string;
  isDefault: boolean;
  isActive: boolean;
  groupCount: number;
  categoryCount: number;
}

export interface InternetPolicyDetail {
  policyId: number;
  policyCode: string;
  policyName: string;
  description: string | null;
  externalPolicyRef: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
}

export interface InternetPolicyForm {
  policyCode: string;
  policyName: string;
  description: string;
  externalPolicyRef: string;
  isDefault: boolean;
  isActive: boolean;
  notes: string;
}

export const emptyInternetPolicyForm: InternetPolicyForm = {
  policyCode: "",
  policyName: "",
  description: "",
  externalPolicyRef: "",
  isDefault: false,
  isActive: true,
  notes: "",
};

export interface PolicyGroupItem {
  policyGroupId: number;
  adGroupId: number | null;
  adGroupName: string;
  notes: string | null;
}

export interface PolicyCategoryItem {
  policyCategoryId: number;
  categoryId: number;
  categoryNameEn: string;
  policyAction: string;
  notes: string | null;
}

// --- Classification visibility ---

export interface ClassificationLevelItem {
  classificationId: number;
  code: string;
  nameTh: string;
  nameEn: string;
  sensitivityRank: number;
  colorToken: string;
  requiresViewAudit: boolean;
}

export interface RoleItem {
  roleId: number;
  code: string;
  name: string;
}

export interface VisibilityCell {
  classificationId: number;
  roleId: number;
  canView: boolean;
  canEdit: boolean;
  canExport: boolean;
}

export interface VisibilityMatrix {
  classifications: ClassificationLevelItem[];
  roles: RoleItem[];
  cells: VisibilityCell[];
}

// --- Pickers ---

export interface ClassificationOption {
  id: number;
  code: string;
  nameTh: string;
  nameEn: string;
  sensitivityRank: number;
  colorToken: string;
}

export interface AccessLevelOption {
  id: number;
  code: string;
  nameEn: string;
  canWrite: boolean;
  colorToken: string;
}
