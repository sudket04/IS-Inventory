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

export type LoginOutcome =
  | { ok: true }
  | { ok: false; error: string; message: string; lockedUntil?: string };

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (username: string, password: string) => Promise<LoginOutcome>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
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
    setStatus("authenticated");
    return { ok: true };
  }, []);

  const logout = React.useCallback(async () => {
    await fetch(`${getApiUrl()}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = React.useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
