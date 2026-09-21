"use client";

import * as React from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuditLogDetail, AuditLogListItem, PagedResult } from "@/lib/audit-logs/types";

const PAGE_SIZE = 25;

// Known so far — every write path in the API that inserts an audit_logs row uses one of these.
const ACTIONS = ["LOGIN", "LOGIN_FAILED", "CREATE", "UPDATE", "DELETE", "PASSWORD_CHANGE"];
const ENTITY_TYPES = ["asset", "user"];

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [result, setResult] = React.useState<PagedResult<AuditLogListItem> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [action, setAction] = React.useState("");
  const [entityType, setEntityType] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search.trim()) params.set("search", search.trim());
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await apiFetch(`/api/audit-logs?${params.toString()}`);
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }, [page, search, action, entityType, dateFrom, dateTo]);

  React.useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  function toggleExpand(id: number) {
    setExpandedId((current) => (current === id ? null : id));
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.pageSize)) : 1;

  return (
    <div className="p-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Audit Logs {result ? `(${result.totalCount})` : ""}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {user?.roleCode === "IT_STAFF"
            ? "Append-only history of your own create, update, delete, and password change actions."
            : "Append-only history of create, update, delete, and password change actions across the system."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search username or entity…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-sm text-text-primary"
          />
        </div>
        <select
          value={action}
          onChange={(e) => {
            setPage(1);
            setAction(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={entityType}
          onChange={(e) => {
            setPage(1);
            setEntityType(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setPage(1);
            setDateFrom(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        />
        <span className="text-sm text-text-tertiary">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setPage(1);
            setDateTo(e.target.value);
          }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 font-medium">Occurred At</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Entity Type</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">Changed Fields</th>
              <th className="px-3 py-2 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">Loading…</td>
              </tr>
            ) : !result || result.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-text-tertiary">No audit log entries found.</td>
              </tr>
            ) : (
              result.items.map((item) => (
                <React.Fragment key={item.auditId}>
                  <tr
                    className="cursor-pointer hover:bg-bg-subtle"
                    onClick={() => toggleExpand(item.auditId)}
                  >
                    <td className="px-3 py-2 text-text-tertiary">
                      {expandedId === item.auditId ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{new Date(item.occurredAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-text-primary">{item.usernameSnapshot ?? "—"}</td>
                    <td className="px-3 py-2">
                      <ActionBadge action={item.action} />
                    </td>
                    <td className="px-3 py-2 text-text-secondary">{item.entityType ?? "—"}</td>
                    <td className="px-3 py-2 text-text-secondary">{item.entityLabel ?? (item.entityId ? `#${item.entityId}` : "—")}</td>
                    <td className="px-3 py-2 text-text-tertiary">{item.changedFields ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-text-tertiary">{item.ipAddress ?? "—"}</td>
                  </tr>
                  {expandedId === item.auditId && <AuditLogDetailRow auditId={item.auditId} />}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && result.totalCount > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
          <span>
            Page {result.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogDetailRow({ auditId }: { auditId: number }) {
  const [detail, setDetail] = React.useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/audit-logs/${auditId}`).then(async (res) => {
      if (!cancelled && res.ok) setDetail(await res.json());
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  return (
    <tr className="bg-bg-subtle">
      <td colSpan={8} className="px-3 py-3">
        {loading ? (
          <p className="text-sm text-text-tertiary">Loading details…</p>
        ) : !detail ? (
          <p className="text-sm text-text-tertiary">Could not load details.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
            <div>
              <p className="mb-1 font-medium text-text-secondary">Before</p>
              <JsonBlock value={detail.beforeJson} />
            </div>
            <div>
              <p className="mb-1 font-medium text-text-secondary">After</p>
              <JsonBlock value={detail.afterJson} />
            </div>
            {detail.userAgent && (
              <p className="md:col-span-2 text-text-tertiary">User agent: {detail.userAgent}</p>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function JsonBlock({ value }: { value: string | null }) {
  if (!value) {
    return <p className="text-text-tertiary">—</p>;
  }
  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // Not JSON (or empty) — show the raw value as-is.
  }
  return (
    <pre className="max-h-64 overflow-auto rounded-md border border-border-default bg-bg-surface p-2 text-text-primary">
      {pretty}
    </pre>
  );
}

// Tailwind can't see class names assembled from runtime data at build time, so the
// mapping has to be written out literally (docs/design/03-design-system.md §3 status colors).
const ACTION_BADGE_CLASSES: Record<string, string> = {
  LOGIN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  LOGIN_FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  UPDATE: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  PASSWORD_CHANGE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function ActionBadge({ action }: { action: string }) {
  const classes = ACTION_BADGE_CLASSES[action] ?? "bg-bg-subtle text-text-tertiary";
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", classes)}>{action}</span>;
}
