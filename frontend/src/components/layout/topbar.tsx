import { Search, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-default bg-bg-surface px-4">
      <span className="text-sm font-semibold text-text-primary">KKND</span>

      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
        <input
          type="search"
          placeholder="Search assets, serials, hostnames, IPs…"
          className="h-8 w-full rounded-md border border-border-default bg-bg-canvas pl-8 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle"
        >
          <Bell className="size-4" />
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
