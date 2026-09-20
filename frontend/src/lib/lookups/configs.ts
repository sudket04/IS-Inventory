import type { LookupConfig } from "@/lib/lookups/types";

export const departmentsConfig: LookupConfig = {
  key: "departments",
  title: "Departments",
  description: "Organizational departments used across assets, users, and file shares.",
  idKey: "departmentId",
  searchKeys: ["code", "name"],
  columns: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
  ],
};

export const assetCategoriesConfig: LookupConfig = {
  key: "asset-categories",
  title: "Asset Categories",
  description: "Top-level asset categories (used as the asset tag prefix).",
  idKey: "categoryId",
  searchKeys: ["code", "name"],
  columns: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "sortOrder", label: "Sort Order" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true, helpText: "Used as the asset tag prefix." },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "iconName", label: "Icon Name", type: "text" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
  ],
};

export const manufacturersConfig: LookupConfig = {
  key: "manufacturers",
  title: "Manufacturers",
  description: "Hardware manufacturers referenced by assets and device models.",
  idKey: "manufacturerId",
  searchKeys: ["name"],
  columns: [
    { key: "name", label: "Name" },
    { key: "supportUrl", label: "Support URL" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "supportUrl", label: "Support URL", type: "text" },
  ],
};

export const vendorsConfig: LookupConfig = {
  key: "vendors",
  title: "Vendors",
  description: "Vendors and service providers referenced by assets and contracts.",
  idKey: "vendorId",
  searchKeys: ["code", "name", "contactPerson"],
  columns: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "contactPerson", label: "Contact" },
    { key: "phone", label: "Phone" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "contactPerson", label: "Contact Person", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "taxId", label: "Tax ID", type: "text" },
  ],
};

export const assetStatusesConfig: LookupConfig = {
  key: "asset-statuses",
  title: "Asset Statuses",
  description: "Lifecycle statuses assets can be in (In Use, In Stock, Retired, …).",
  idKey: "statusId",
  searchKeys: ["code", "name"],
  columns: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "isOperational", label: "Operational", render: (r) => (r.isOperational ? "Yes" : "No") },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "colorToken", label: "Color Token", type: "text", required: true, helpText: "Design token name, e.g. emerald, amber, red." },
    { key: "isOperational", label: "Counts as operational", type: "checkbox" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
  ],
};

export const serverRolesConfig: LookupConfig = {
  key: "server-roles",
  title: "Server Roles",
  description: "Roles a server asset can be assigned (Domain Controller, Database, …).",
  idKey: "serverRoleId",
  searchKeys: ["code", "name", "roleGroup"],
  columns: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "roleGroup", label: "Group" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    {
      key: "roleGroup",
      label: "Group",
      type: "select",
      required: true,
      options: ["INFRASTRUCTURE", "DATA", "APPLICATION", "SECURITY", "BACKUP", "MANAGEMENT"].map((v) => ({ value: v, label: v })),
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "isDhcpProvider", label: "Is a DHCP provider", type: "checkbox" },
    { key: "isCriticalService", label: "Critical service", type: "checkbox" },
    { key: "iconName", label: "Icon Name", type: "text" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
  ],
};

export const relationshipTypesConfig: LookupConfig = {
  key: "relationship-types",
  title: "Relationship Types",
  description: "Types of relationships between assets (Hosted On, Depends On, …).",
  idKey: "relationshipTypeId",
  searchKeys: ["code", "forwardName", "inverseName"],
  columns: [
    { key: "code", label: "Code" },
    { key: "forwardName", label: "Forward" },
    { key: "inverseName", label: "Inverse" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "forwardName", label: "Forward Name", type: "text", required: true, placeholder: "e.g. Hosted On" },
    { key: "inverseName", label: "Inverse Name", type: "text", required: true, placeholder: "e.g. Hosts" },
  ],
};

export const networkZonesConfig: LookupConfig = {
  key: "network-zones",
  title: "Network Zones",
  description: "Trust zones VLANs can belong to (DMZ, Internal, Guest, …).",
  idKey: "zoneId",
  searchKeys: ["code", "name"],
  columns: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "trustLevel", label: "Trust Level" },
    { key: "isInternetFacing", label: "Internet Facing", render: (r) => (r.isInternetFacing ? "Yes" : "No") },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "trustLevel", label: "Trust Level (0–100)", type: "number", required: true, min: 0, max: 100 },
    { key: "colorToken", label: "Color Token", type: "text", required: true },
    { key: "isInternetFacing", label: "Internet facing", type: "checkbox" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
  ],
};

export const folderClassificationLevelsConfig: LookupConfig = {
  key: "folder-classification-levels",
  title: "Folder Classification Levels",
  description: "Sensitivity levels used to control folder visibility by role.",
  idKey: "classificationId",
  searchKeys: ["code", "nameEn", "nameTh"],
  columns: [
    { key: "code", label: "Code" },
    { key: "nameEn", label: "Name (EN)" },
    { key: "nameTh", label: "Name (TH)" },
    { key: "sensitivityRank", label: "Rank" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "nameEn", label: "Name (English)", type: "text", required: true },
    { key: "nameTh", label: "Name (Thai)", type: "text", required: true },
    { key: "sensitivityRank", label: "Sensitivity Rank (1 = most sensitive)", type: "number", required: true, min: 1, max: 99 },
    { key: "colorToken", label: "Color Token", type: "text", required: true },
    { key: "requiresViewAudit", label: "Requires view audit", type: "checkbox" },
    { key: "description", label: "Description", type: "textarea" },
  ],
};

export const accessLevelsConfig: LookupConfig = {
  key: "access-levels",
  title: "Access Levels",
  description: "Permission levels assignable on file shares (Read Only, Read/Write, …).",
  idKey: "accessLevelId",
  searchKeys: ["code", "nameEn", "nameTh"],
  columns: [
    { key: "code", label: "Code" },
    { key: "nameEn", label: "Name (EN)" },
    { key: "canWrite", label: "Write Access", render: (r) => (r.canWrite ? "Yes" : "No") },
    { key: "privilegeRank", label: "Rank" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "nameEn", label: "Name (English)", type: "text", required: true },
    { key: "nameTh", label: "Name (Thai)", type: "text", required: true },
    { key: "canWrite", label: "Grants write access", type: "checkbox" },
    { key: "privilegeRank", label: "Privilege Rank (higher = more access)", type: "number", required: true },
    { key: "colorToken", label: "Color Token", type: "text", required: true },
  ],
};

export const webCategoriesConfig: LookupConfig = {
  key: "web-categories",
  title: "Web Categories",
  description: "Website categories used by Internet access policies.",
  idKey: "categoryId",
  searchKeys: ["code", "nameEn", "nameTh"],
  columns: [
    { key: "code", label: "Code" },
    { key: "nameEn", label: "Name (EN)" },
    { key: "riskLevel", label: "Risk Level" },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "nameEn", label: "Name (English)", type: "text", required: true },
    { key: "nameTh", label: "Name (Thai)", type: "text", required: true },
    { key: "riskLevel", label: "Risk Level (1 low – 5 high)", type: "number", required: true, min: 1, max: 5 },
    { key: "sortOrder", label: "Sort Order", type: "number" },
  ],
};

export const ALL_LOOKUP_CONFIGS = [
  { group: "Organization", config: departmentsConfig },
  { group: "Master Asset Data", config: assetCategoriesConfig },
  { group: "Master Asset Data", config: manufacturersConfig },
  { group: "Master Asset Data", config: vendorsConfig },
  { group: "Master Asset Data", config: assetStatusesConfig },
  { group: "Master Asset Data", config: serverRolesConfig },
  { group: "Master Asset Data", config: relationshipTypesConfig },
  { group: "Network", config: networkZonesConfig },
  { group: "Access Control", config: folderClassificationLevelsConfig },
  { group: "Access Control", config: accessLevelsConfig },
  { group: "Access Control", config: webCategoriesConfig },
];
