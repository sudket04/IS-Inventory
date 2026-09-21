"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { useAuth, type AuthUser, type PermissionsMap } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSWORD_POLICY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

interface LoginResponseBody {
  accessToken: string;
  user: AuthUser;
  permissions: PermissionsMap;
}

/** Self-service password change. Used both as the mandatory full-screen gate when
 * mustChangePassword is true, and could be reused later for a voluntary "change my
 * password" entry point — the form itself doesn't know which context it's in. */
export function ChangePasswordForm({ forced, onDone }: { forced?: boolean; onDone?: () => void }) {
  const { applySession } = useAuth();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      setErrorMessage("New password must be at least 8 characters and include both letters and digits.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    const res = await apiFetch("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(body.message ?? "Could not change password. Please try again.");
      return;
    }

    const { accessToken, user, permissions } = body as LoginResponseBody;
    applySession(accessToken, user, permissions);
    onDone?.();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text-primary">
          {forced ? "You must change your password" : "Change password"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {forced
            ? "For security, set a new password before you can continue."
            : "Set a new password for your account."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-text-tertiary">At least 8 characters, with letters and digits.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Changing password…" : "Change password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
