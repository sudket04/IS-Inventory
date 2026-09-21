"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

interface UserListItem {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  departmentName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}

interface RoleItem {
  roleId: number;
  code: string;
  name: string;
}

const emptyForm = { username: "", email: "", fullName: "", initialPassword: "", roleId: "" };

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = React.useState<UserListItem[]>([]);
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    const res = await apiFetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  React.useEffect(() => {
    (async () => {
      await Promise.all([
        loadUsers(),
        apiFetch("/api/roles").then((res) => (res.ok ? res.json() : [])).then(setRoles),
      ]);
      setLoading(false);
    })();
  }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ...form, roleId: Number(form.roleId), departmentId: null, phone: null }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.message ?? "Could not create user.");
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    await loadUsers();
  }

  async function toggleActive(u: UserListItem) {
    await apiFetch(`/api/users/${u.userId}`, {
      method: "PUT",
      body: JSON.stringify({
        fullName: u.fullName,
        roleId: roles.find((r) => r.code === u.roleCode)?.roleId,
        departmentId: null,
        phone: null,
        isActive: !u.isActive,
      }),
    });
    await loadUsers();
  }

  if (me?.roleCode !== "ADMIN") {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Users</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Create, edit roles, and deactivate accounts (FR-AU-08/09 — accounts are never deleted).
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New user"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 grid max-w-2xl grid-cols-2 gap-3 rounded-md border border-border-default bg-bg-surface p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-username">Username</Label>
            <Input
              id="new-username"
              required
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-fullname">Full name</Label>
            <Input
              id="new-fullname"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-role">Role</Label>
            <select
              id="new-role"
              required
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
            >
              <option value="" disabled>
                Select a role
              </option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="new-password">Initial password</Label>
            <Input
              id="new-password"
              type="password"
              required
              value={form.initialPassword}
              onChange={(e) => setForm((f) => ({ ...f, initialPassword: e.target.value }))}
            />
            <p className="text-xs text-text-tertiary">
              At least 8 characters, with both letters and digits. The user must change it on first login.
            </p>
          </div>

          {formError && (
            <p role="alert" className="col-span-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="col-span-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Username</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last login</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.userId}>
                  <td className="px-3 py-2 text-text-primary">{u.fullName}</td>
                  <td className="px-3 py-2 text-text-secondary">{u.username}</td>
                  <td className="px-3 py-2 text-text-secondary">{u.roleName}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-bg-subtle text-text-tertiary"
                      )}
                    >
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={u.userId === me?.userId}
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
