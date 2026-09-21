"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import type { VisibilityMatrix, VisibilityCell } from "@/lib/permission-control/types";

export default function ClassificationVisibilityPage() {
  const [matrix, setMatrix] = React.useState<VisibilityMatrix | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch("/api/admin/classification-visibility");
    if (res.ok) setMatrix(await res.json());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function toggle(cell: VisibilityCell, field: "canView" | "canEdit" | "canExport") {
    if (!matrix) return;
    const key = `${cell.classificationId}-${cell.roleId}`;
    setSaving(key);

    const next = { ...cell, [field]: !cell[field] };
    // Editing/exporting implies viewing — mirrors the server-side rule in ClassificationVisibilityController.
    if (field === "canView" && !next.canView) {
      next.canEdit = false;
      next.canExport = false;
    }

    const res = await apiFetch(`/api/admin/classification-visibility/${cell.classificationId}/${cell.roleId}`, {
      method: "PUT",
      body: JSON.stringify({ canView: next.canView, canEdit: next.canEdit, canExport: next.canExport }),
    });

    if (res.ok) {
      const saved: VisibilityCell = await res.json();
      setMatrix((m) =>
        m
          ? {
              ...m,
              cells: m.cells.map((c) => (c.classificationId === saved.classificationId && c.roleId === saved.roleId ? saved : c)),
            }
          : m
      );
    }
    setSaving(null);
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Classification Visibility</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Which role may view, edit, or export File Shares at each of the 7 classification levels. A share whose level a role can&apos;t
        view is left off that role&apos;s list entirely — not even the folder name shows.
      </p>

      {!matrix ? (
        <p className="mt-6 text-sm text-text-tertiary">Loading…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-border-default">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-3 py-2 font-medium">Classification</th>
                {matrix.roles.map((r) => (
                  <th key={r.roleId} className="px-3 py-2 text-center font-medium" colSpan={3}>{r.name}</th>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-1" />
                {matrix.roles.map((r) => (
                  <React.Fragment key={r.roleId}>
                    <th className="px-2 py-1 text-center font-normal normal-case text-text-tertiary">View</th>
                    <th className="px-2 py-1 text-center font-normal normal-case text-text-tertiary">Edit</th>
                    <th className="px-2 py-1 text-center font-normal normal-case text-text-tertiary">Export</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default bg-bg-surface">
              {matrix.classifications.map((cls) => (
                <tr key={cls.classificationId}>
                  <td className="px-3 py-2">
                    <StatusBadge colorToken={cls.colorToken} label={`${cls.sensitivityRank}. ${cls.nameEn}`} />
                    {cls.requiresViewAudit && <span className="ml-1.5 text-xs text-text-tertiary" title="Opening this level logs a VIEW_SENSITIVE audit entry">🔍</span>}
                  </td>
                  {matrix.roles.map((r) => {
                    const cell = matrix.cells.find((c) => c.classificationId === cls.classificationId && c.roleId === r.roleId);
                    if (!cell) return <td key={r.roleId} colSpan={3} />;
                    const key = `${cls.classificationId}-${r.roleId}`;
                    const disabled = saving === key;
                    return (
                      <React.Fragment key={r.roleId}>
                        <td className="px-2 py-2 text-center">
                          <input type="checkbox" checked={cell.canView} disabled={disabled} onChange={() => toggle(cell, "canView")} className="size-4" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input type="checkbox" checked={cell.canEdit} disabled={disabled || !cell.canView} onChange={() => toggle(cell, "canEdit")} className="size-4" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input type="checkbox" checked={cell.canExport} disabled={disabled || !cell.canView} onChange={() => toggle(cell, "canExport")} className="size-4" />
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
