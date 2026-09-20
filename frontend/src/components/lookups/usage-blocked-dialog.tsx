"use client";

import { Button } from "@/components/ui/button";

interface UsageResult {
  label: string;
  count: number;
}

export function UsageBlockedDialog({
  title,
  usages,
  onDeactivateInstead,
  onCancel,
}: {
  title: string;
  usages: UsageResult[];
  onDeactivateInstead: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
        <h2 className="text-base font-semibold text-text-primary">Cannot delete &quot;{title}&quot;</h2>
        <p className="mt-1 text-sm text-text-secondary">This record is still in use:</p>

        <ul className="mt-3 space-y-1 text-sm text-text-primary">
          {usages
            .filter((u) => u.count > 0)
            .map((u) => (
              <li key={u.label} className="flex justify-between rounded-md bg-bg-subtle px-3 py-1.5">
                <span>{u.label}</span>
                <span className="font-medium">{u.count}</span>
              </li>
            ))}
        </ul>

        <p className="mt-3 text-sm text-text-secondary">
          If you no longer want it available, deactivate it instead — existing data and past
          reports keep their original values.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onDeactivateInstead}>
            Deactivate instead
          </Button>
        </div>
      </div>
    </div>
  );
}
