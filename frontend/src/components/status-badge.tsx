import { cn } from "@/lib/utils";

// Matches dbo.asset_statuses.color_token seed data (emerald/sky/amber/slate/rose) plus a
// couple of extra tokens used ad hoc elsewhere in the app.
const STATUS_BADGE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  slate: "bg-bg-subtle text-text-tertiary",
};

export function colorTokenHex(colorToken: string): string {
  const hex: Record<string, string> = {
    emerald: "#10b981",
    sky: "#0ea5e9",
    amber: "#f59e0b",
    rose: "#f43f5e",
    red: "#ef4444",
    slate: "#94a3b8",
  };
  return hex[colorToken] ?? hex.slate;
}

export function StatusBadge({ colorToken, label }: { colorToken: string; label: string }) {
  const classes = STATUS_BADGE_CLASSES[colorToken] ?? STATUS_BADGE_CLASSES.slate;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", classes)}>{label}</span>;
}
