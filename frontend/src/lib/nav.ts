import type { PermissionsMap } from "@/lib/auth/auth-context";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  menuKey: string;
  children?: NavItem[];
}

// เมนูตามสิทธิ์ — docs/design/01-user-flow.md §1.2. หน้าที่ยังไม่ได้สร้างจริง (Sprint 2+)
// ยังคงอยู่ในเมนูเพื่อให้เห็นโครงสร้างครบ แต่ยังไม่มีปลายทางจนกว่าจะถึง Sprint นั้น
// menuKey ต้องตรงกับ dbo.menus.menu_key (docs/database/17-module-user-menu-permissions.sql) —
// การมองเห็นแต่ละเมนูมาจากสิทธิ์จริงของผู้ใช้ (Role เริ่มต้น + Override รายคน) ไม่ใช่ Role ตรงๆ แล้ว
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "layout-dashboard", menuKey: "dashboard" },
  { label: "Assets", href: "/assets", icon: "server", menuKey: "assets" },
  {
    // v1.7 Server Domain — Server + Storage (SRV/STG) moved here exclusively (see
    // AssetsController.ManagedElsewhereCategoryCodes); "Assets" above still lists/reads them
    // read-only for cross-category browsing only.
    label: "Server",
    href: "/server-inventory",
    icon: "server",
    menuKey: "server_inventory",
    children: [
      { label: "Server Inventory", href: "/server-inventory", icon: "hard-drive", menuKey: "server_inventory" },
      { label: "Clusters", href: "/clusters", icon: "layers", menuKey: "clusters" },
      { label: "Server List", href: "/server-list", icon: "list-tree", menuKey: "server_list" },
    ],
  },
  {
    // v1.8 restructure — Network Hardware split out of the generic Assets flow into its own
    // module (NetworkDevicesController), parallel to "Server" above; VLANs moved in alongside
    // it since both are Network-domain data, matching the approved reference design.
    label: "Network",
    href: "/network-hardware",
    icon: "network",
    menuKey: "network_hardware",
    children: [
      { label: "Network Hardware", href: "/network-hardware", icon: "router", menuKey: "network_hardware" },
      { label: "VLANs", href: "/vlans", icon: "network", menuKey: "vlans" },
    ],
  },
  { label: "Racks", href: "/racks", icon: "warehouse", menuKey: "racks" },
  { label: "Software", href: "/software", icon: "disc", menuKey: "software" },
  { label: "Contracts", href: "/contracts", icon: "file-text", menuKey: "contracts" },
  { label: "Reports", href: "/reports", icon: "bar-chart-3", menuKey: "reports" },
  { label: "Import", href: "/import", icon: "upload", menuKey: "import" },
  { label: "File Shares", href: "/file-shares", icon: "folder", menuKey: "file_shares" },
  { label: "Internet Policies", href: "/internet-policies", icon: "globe", menuKey: "internet_policies" },
  { label: "Audit Logs", href: "/audit-logs", icon: "search", menuKey: "audit_logs" },
  {
    label: "Administration",
    href: "/admin",
    icon: "settings",
    menuKey: "admin_users",
    children: [
      { label: "Users", href: "/admin/users", icon: "users", menuKey: "admin_users" },
      { label: "Locations", href: "/admin/locations", icon: "map-pin", menuKey: "admin_locations" },
      { label: "Master Data", href: "/admin/master-data", icon: "database", menuKey: "admin_master_data" },
      { label: "Classification Visibility", href: "/admin/classification-visibility", icon: "shield-check", menuKey: "admin_classification_visibility" },
      { label: "Settings", href: "/admin/settings", icon: "sliders", menuKey: "admin_settings" },
    ],
  },
];

function canView(permissions: PermissionsMap, menuKey: string): boolean {
  return permissions[menuKey]?.canView ?? false;
}

export function visibleNavItems(permissions: PermissionsMap): NavItem[] {
  return NAV_ITEMS
    // A grouping item (Server, Administration) has its own menuKey only because it's also a
    // clickable link to its first child's page — its own permission is irrelevant to whether
    // the *group* shows; that's decided purely by whether any child survives below.
    .map((item) => ({
      ...item,
      children: item.children?.filter((c) => canView(permissions, c.menuKey)),
    }))
    .filter((item) => (item.children ? item.children.length > 0 : canView(permissions, item.menuKey)));
}
