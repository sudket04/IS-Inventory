"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { InternetPolicyListItem } from "@/lib/permission-control/types";

export default function InternetPoliciesPage() {
  const [items, setItems] = React.useState<InternetPolicyListItem[] | null>(null);

  React.useEffect(() => {
    apiFetch("/api/internet-policies").then(async (res) => {
      if (res.ok) setItems(await res.json());
    });
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Internet Policies {items ? `(${items.length})` : ""}</h1>
          <p className="mt-1 text-sm text-text-secondary">Internet access policies bound to AD groups, with optional web-category rules.</p>
        </div>
        <Link href="/internet-policies/new">
          <Button size="sm">+ New Policy</Button>
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-default">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Default</th>
              <th className="px-3 py-2 font-medium">Active</th>
              <th className="px-3 py-2 font-medium">AD Groups</th>
              <th className="px-3 py-2 font-medium">Web Rules</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-surface">
            {!items ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">No policies yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.policyId}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    <Link href={`/internet-policies/${item.policyId}`} className="hover:underline">{item.policyCode}</Link>
                  </td>
                  <td className="px-3 py-2 text-text-primary">{item.policyName}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.isDefault ? "Yes" : "—"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.groupCount}</td>
                  <td className="px-3 py-2 text-text-secondary">{item.categoryCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
