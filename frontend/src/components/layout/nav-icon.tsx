import {
  LayoutDashboard,
  Server,
  Disc,
  BarChart3,
  Upload,
  Search,
  Settings,
  Users,
  Database,
  Sliders,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  server: Server,
  disc: Disc,
  "bar-chart-3": BarChart3,
  upload: Upload,
  search: Search,
  settings: Settings,
  users: Users,
  database: Database,
  sliders: Sliders,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
