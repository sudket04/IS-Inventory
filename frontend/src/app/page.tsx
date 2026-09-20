import { Button } from "@/components/ui/button";

async function getDbHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080";
  try {
    const res = await fetch(`${apiUrl}/health/db`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { canConnect: boolean; tableCount: number };
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getDbHealth();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text-primary">
          KKND — IT Inventory Management
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sprint 0 — Project scaffolding ready
        </p>

        <div className="mt-4 rounded-md border border-border-default bg-bg-subtle p-3">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Database Connection
          </p>
          {health?.canConnect ? (
            <p className="mt-1 text-sm text-text-primary">
              ✅ Connected — {health.tableCount} tables found
            </p>
          ) : (
            <p className="mt-1 text-sm text-text-primary">
              ⚠️ Backend API not reachable (make sure{" "}
              <code className="font-mono text-xs">dotnet run</code> is running)
            </p>
          )}
        </div>

        <Button className="mt-4 w-full" size="sm">
          Test button (Design Token)
        </Button>
      </div>
    </main>
  );
}
