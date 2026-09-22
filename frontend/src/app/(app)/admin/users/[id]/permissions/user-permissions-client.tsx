"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth, usePermission } from "@/lib/auth/auth-context";

interface UserListItem {
  userId: number;
  username: string;
  fullName: string;
  roleName: string;
}

interface MenuPermissionRow {
  menuKey: string;
  menuName: string;
  roleView: boolean;
  roleCreate: boolean;
  roleEdit: boolean;
  roleDelete: boolean;
  overrideView: boolean | null;
  overrideCreate: boolean | null;
  overrideEdit: boolean | null;
  overrideDelete: boolean | null;
}

type Action = "View" | "Create" | "Edit" | "Delete";
const ACTIONS: Action[] = ["View", "Create", "Edit", "Delete"];

function overrideValue(row: MenuPermissionRow, action: Action): boolean | null {
  switch (action) {
    case "View": return row.overrideView;
    case "Create": return row.overrideCreate;
    case "Edit": return row.overrideEdit;
    case "Delete": return row.overrideDelete;
  }
}

function roleValue(row: MenuPermissionRow, action: Action): boolean {
  switch (action) {
    case "View": return row.roleView;
    case "Create": return row.roleCreate;
    case "Edit": return row.roleEdit;
    case "Delete": return row.roleDelete;
  }
}

/** Admin > Users > Permissions (Phase 2) — per-user override editor for the Phase 1 permission
 * engine (docs/HANDOFF.md §4.20). Each menu row's four actions default to "Inherit" (the role's
 * default, shown in parentheses); switching a cell to Allow/Deny writes a sparse override via
 * PUT /api/users/{id}/permissions/{menuKey} — only the changed field stops inheriting, the rest
 * of that row's nulls (if any) keep inheriting. "Reset" clears the whole row back to Inherit. */
export function UserPermissionsClient({ userId }: { userId: string }) {
  const { user: me } = useAuth();
  const perm = usePermission("admin_users");
  const isSelf = me?.userId === Number(userId);
  const readOnly = isSelf || !perm.canEdit;

  const [target, setTarget] = React.useState<UserListItem | null>(null);
  const [rows, setRows] = React.useState<MenuPermissionRow[] | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [usersRes, permsRes] = await Promise.all([
      apiFetch("/api/users"),
      apiFetch(`/api/users/${userId}/permissions`),
    ]);
    if (usersRes.ok) {
      const users: UserListItem[] = await usersRes.json();
      setTarget(users.find((u) => u.userId === Number(userId)) ?? null);
    }
    if (permsRes.ok) setRows(await permsRes.json());
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function setOverride(row: MenuPermissionRow, action: Action, value: boolean | null) {
    setError(null);
    setSaving(row.menuKey);

    const body = {
      canView: action === "View" ? value : row.overrideView,
      canCreate: action === "Create" ? value : row.overrideCreate,
      canEdit: action === "Edit" ? value : row.overrideEdit,
      canDelete: action === "Delete" ? value : row.overrideDelete,
    };

    const res = await apiFetch(`/api/users/${userId}/permissions/${row.menuKey}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    setSaving(null);
    if (res.ok) {
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save this permission.");
    }
  }

  async function resetRow(row: MenuPermissionRow) {
    setError(null);
    setSaving(row.menuKey);
    const res = await apiFetch(`/api/users/${userId}/permissions/${row.menuKey}`, { method: "DELETE" });
    setSaving(null);
    if (res.ok || res.status === 204) {
      await load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not reset this menu.");
    }
  }

  if (!perm.canView) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
          <ChevronLeft className="size-4" /> Users
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-text-primary">
          Permissions{target ? ` — ${target.fullName} (${target.username})` : ""}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {target ? `Role default: ${target.roleName}. ` : ""}
          Overrides take precedence over the role&apos;s default menu permissions — leave a cell on
          &quot;Inherit&quot; to fall back to the role default shown in parentheses.
        </p>
      </div>

      {isSelf && (
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          You cannot change your own permissions — ask another Admin to make changes here.
        </p>
      )}
      {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Menu</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-3 py-2 font-medium">{a}</th>
              ))}
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!rows ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">Loading…</td>
              </tr>
            ) : (
              rows.map((row) => {
                const hasOverride =
                  row.overrideView !== null || row.overrideCreate !== null ||
                  row.overrideEdit !== null || row.overrideDelete !== null;
                return (
                  <tr key={row.menuKey}>
                    <td className="px-3 py-2 text-text-primary">
                      {row.menuName}
                      {hasOverride && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent-text">
                          Override
                        </span>
                      )}
                    </td>
                    {ACTIONS.map((action) => {
                      const ov = overrideValue(row, action);
                      const roleDefault = roleValue(row, action);
                      return (
                        <td key={action} className="px-3 py-2">
                          <select
                            disabled={readOnly || saving === row.menuKey}
                            value={ov === null ? "inherit" : ov ? "allow" : "deny"}
                            onChange={(e) => {
                              const v = e.target.value;
                              setOverride(row, action, v === "inherit" ? null : v === "allow");
                            }}
                            className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-xs text-text-primary disabled:opacity-60"
                          >
                            <option value="inherit">Inherit ({roleDefault ? "Allow" : "Deny"})</option>
                            <option value="allow">Allow</option>
                            <option value="deny">Deny</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right">
                      {hasOverride && !readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Reset to role default"
                          disabled={saving === row.menuKey}
                          onClick={() => resetRow(row)}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
