"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-tertiary">Loading…</p>
      </main>
    );
  }

  // Blocks every route under (app) — not just a redirect on one page — so a forced
  // password change (fresh install's admin, or anyone an Admin just reset) can't be
  // skipped by navigating straight to a URL. Backend enforces the same gate server-side.
  if (user?.mustChangePassword) {
    return <ChangePasswordForm forced />;
  }

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
