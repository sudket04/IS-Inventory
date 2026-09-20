"use client";

import * as React from "react";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const [health, setHealth] = React.useState<{ canConnect: boolean; tableCount: number } | null>(null);

  React.useEffect(() => {
    fetch(`${getApiUrl()}/health/db`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">
        Welcome back, {user?.fullName}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Signed in as {user?.roleName}. Dashboard widgets ship in Sprint 5.
      </p>

      <div className="mt-4 max-w-md rounded-md border border-border-default bg-bg-subtle p-3">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Database Connection
        </p>
        {health?.canConnect ? (
          <p className="mt-1 text-sm text-text-primary">
            ✅ Connected — {health.tableCount} tables found
          </p>
        ) : (
          <p className="mt-1 text-sm text-text-primary">
            ⚠️ Backend API not reachable
          </p>
        )}
      </div>
    </div>
  );
}
