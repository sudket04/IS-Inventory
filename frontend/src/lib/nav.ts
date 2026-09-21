import type { AuthUser } from "@/lib/auth/auth-context";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: AuthUser["roleCode"][];
  children?: NavItem[];
}

// เมนูตามสิทธิ์ — docs/design/01-user-flow.md §1.2. หน้าที่ยังไม่ได้สร้างจริง (Sprint 2+)
// ยังคงอยู่ในเมนูเพื่อให้เห็นโครงสร้างครบ แต่ยังไม่มีปลายทางจนกว่าจะถึง Sprint นั้น
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "layout-dashboard", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Assets", href: "/assets", icon: "server", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Clusters", href: "/clusters", icon: "layers", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Racks", href: "/racks", icon: "warehouse", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "VLANs", href: "/vlans", icon: "network", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Software", href: "/software", icon: "disc", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Contracts", href: "/contracts", icon: "file-text", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Reports", href: "/reports", icon: "bar-chart-3", roles: ["ADMIN", "IT_STAFF", "AUDITOR"] },
  { label: "Import", href: "/import", icon: "upload", roles: ["ADMIN", "IT_STAFF"] },
  { label: "File Shares", href: "/file-shares", icon: "folder", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Internet Policies", href: "/internet-policies", icon: "globe", roles: ["ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"] },
  { label: "Audit Logs", href: "/audit-logs", icon: "search", roles: ["ADMIN", "IT_STAFF", "AUDITOR"] },
  {
    label: "Administration",
    href: "/admin",
    icon: "settings",
    roles: ["ADMIN"],
    children: [
      { label: "Users", href: "/admin/users", icon: "users", roles: ["ADMIN"] },
      { label: "Locations", href: "/admin/locations", icon: "map-pin", roles: ["ADMIN"] },
      { label: "Master Data", href: "/admin/master-data", icon: "database", roles: ["ADMIN"] },
      { label: "Classification Visibility", href: "/admin/classification-visibility", icon: "shield-check", roles: ["ADMIN"] },
      { label: "Settings", href: "/admin/settings", icon: "sliders", roles: ["ADMIN"] },
    ],
  },
];

export function visibleNavItems(roleCode: AuthUser["roleCode"]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(roleCode))
    .map((item) => ({
      ...item,
      children: item.children?.filter((c) => c.roles.includes(roleCode)),
    }));
}
