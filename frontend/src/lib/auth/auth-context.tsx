"use client";

import * as React from "react";
import { getApiUrl } from "@/lib/api";
import { setAccessToken } from "@/lib/auth/token-store";

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  roleCode: "ADMIN" | "IT_STAFF" | "AUDITOR" | "VIEWER";
  roleName: string;
  mustChangePassword: boolean;
}

/** Mirrors backend IsInventory.Domain.Security.MenuPermission — effective permission
 * (role default with any per-user override already applied) for one menu. */
export interface MenuPermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/** Keyed by dbo.menus.menu_key (see frontend/src/lib/nav.ts). */
export type PermissionsMap = Record<string, MenuPermission>;

export type LoginOutcome =
  | { ok: true }
  | { ok: false; error: string; message: string; lockedUntil?: string };

interface AuthContextValue {
  user: AuthUser | null;
  permissions: PermissionsMap;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (username: string, password: string) => Promise<LoginOutcome>;
  logout: () => Promise<void>;
  /** Applies a fresh access token + user + permissions straight from a LoginResponse-shaped
   * API result — used after a forced password change to clear mustChangePassword without a
   * full reload. */
  applySession: (accessToken: string, user: AuthUser, permissions: PermissionsMap) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [permissions, setPermissions] = React.useState<PermissionsMap>({});
  const [status, setStatus] = React.useState<AuthContextValue["status"]>("loading");

  // On first load, a refresh cookie from a previous session may still be valid —
  // silently try to mint a fresh access token before deciding the user is logged out.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          const body = await res.json();
          setAccessToken(body.accessToken);
          setUser(body.user);
          setPermissions(body.permissions ?? {});
          setStatus("authenticated");
        } else {
          setAccessToken(null);
          setStatus("unauthenticated");
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(async (username: string, password: string): Promise<LoginOutcome> => {
    const res = await fetch(`${getApiUrl()}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? "unknown_error",
        message: body.message ?? "Something went wrong. Please try again.",
        lockedUntil: body.lockedUntil,
      };
    }

    setAccessToken(body.accessToken);
    setUser(body.user);
    setPermissions(body.permissions ?? {});
    setStatus("authenticated");
    return { ok: true };
  }, []);

  const logout = React.useCallback(async () => {
    await fetch(`${getApiUrl()}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
    setPermissions({});
    setStatus("unauthenticated");
  }, []);

  const applySession = React.useCallback((accessToken: string, nextUser: AuthUser, nextPermissions: PermissionsMap) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    setPermissions(nextPermissions);
    setStatus("authenticated");
  }, []);

  const value = React.useMemo(
    () => ({ user, permissions, status, login, logout, applySession }),
    [user, permissions, status, login, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
