"use client";

import * as React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { VlanIssueItem } from "@/lib/vlans/types";

export function VlanIssuesPanel({ vlanId }: { vlanId: number }) {
  const [issues, setIssues] = React.useState<VlanIssueItem[] | null>(null);

  React.useEffect(() => {
    apiFetch(`/api/vlans/${vlanId}/issues`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setIssues)
      .catch(() => setIssues([]));
  }, [vlanId]);

  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
      {issues.map((issue, i) => (
        <p key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
          {issue.severity === "ERROR" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          {issue.issueDetail}
        </p>
      ))}
    </div>
  );
}
