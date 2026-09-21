"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { visibleNavItems } from "@/lib/nav";
import { NavIcon } from "@/components/layout/nav-icon";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, permissions } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  if (!user) return null;
  const items = visibleNavItems(permissions);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border-default bg-bg-surface transition-[width]",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <div key={item.href}>
            <Link
              href={item.children ? item.children[0]?.href ?? item.href : item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent/10 text-accent-text"
                  : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
              )}
              title={collapsed ? item.label : undefined}
            >
              <NavIcon name={item.icon} className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>

            {!collapsed && item.children && item.children.length > 0 && (
              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border-default pl-2">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive(child.href)
                        ? "bg-accent/10 text-accent-text"
                        : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-border-default p-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-text-tertiary hover:bg-bg-subtle hover:text-text-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
