"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import type { PolicyGroupItem, PolicyCategoryItem } from "@/lib/permission-control/types";

const POLICY_ACTIONS = ["ALLOW", "BLOCK", "WARN"];

export function InternetPolicyBindingsPanel({ policyId }: { policyId: number }) {
  const [groups, setGroups] = React.useState<PolicyGroupItem[] | null>(null);
  const [categories, setCategories] = React.useState<PolicyCategoryItem[] | null>(null);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newCategoryId, setNewCategoryId] = React.useState("");
  const [newCategoryAction, setNewCategoryAction] = React.useState("BLOCK");
  const [error, setError] = React.useState<string | null>(null);

  const webCategories = usePicker("web-categories");

  const loadGroups = React.useCallback(async () => {
    const res = await apiFetch(`/api/internet-policies/${policyId}/groups`);
    if (res.ok) setGroups(await res.json());
  }, [policyId]);

  const loadCategories = React.useCallback(async () => {
    const res = await apiFetch(`/api/internet-policies/${policyId}/categories`);
    if (res.ok) setCategories(await res.json());
  }, [policyId]);

  React.useEffect(() => {
    loadGroups();
    loadCategories();
  }, [loadGroups, loadCategories]);

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newGroupName.trim()) return;
    const res = await apiFetch(`/api/internet-policies/${policyId}/groups`, {
      method: "POST",
      body: JSON.stringify({ adGroupNameRaw: newGroupName.trim() }),
    });
    if (res.ok) {
      setNewGroupName("");
      await loadGroups();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not bind this AD group.");
    }
  }

  async function handleRemoveGroup(policyGroupId: number) {
    await apiFetch(`/api/internet-policies/${policyId}/groups/${policyGroupId}`, { method: "DELETE" });
    await loadGroups();
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newCategoryId) return;
    const res = await apiFetch(`/api/internet-policies/${policyId}/categories`, {
      method: "POST",
      body: JSON.stringify({ categoryId: Number(newCategoryId), policyAction: newCategoryAction }),
    });
    if (res.ok) {
      setNewCategoryId("");
      await loadCategories();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not add this web category rule.");
    }
  }

  async function handleRemoveCategory(policyCategoryId: number) {
    await apiFetch(`/api/internet-policies/${policyId}/categories/${policyCategoryId}`, { method: "DELETE" });
    await loadCategories();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="border-b border-border-default px-3 py-2">
          <h2 className="text-sm font-semibold text-text-primary">AD Groups this policy applies to</h2>
        </div>
        <form onSubmit={handleAddGroup} className="flex items-center gap-2 border-b border-border-default p-3">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="GRP-AllStaff"
            className="h-8 flex-1 rounded-md border border-border-default bg-bg-surface px-2 text-sm"
          />
          <Button type="submit" size="sm">+ Bind Group</Button>
        </form>
        {error && <p className="px-3 pb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <ul className="divide-y divide-border-default text-sm">
          {!groups ? (
            <li className="px-3 py-3 text-center text-text-tertiary">Loading…</li>
          ) : groups.length === 0 ? (
            <li className="px-3 py-3 text-center text-text-tertiary">No AD groups bound yet.</li>
          ) : (
            groups.map((g) => (
              <li key={g.policyGroupId} className="flex items-center justify-between px-3 py-2">
                <span className="text-text-primary">{g.adGroupName}</span>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveGroup(g.policyGroupId)}>Unbind</Button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="border-b border-border-default px-3 py-2">
          <h2 className="text-sm font-semibold text-text-primary">Web Category Rules (optional)</h2>
        </div>
        <form onSubmit={handleAddCategory} className="flex items-center gap-2 border-b border-border-default p-3">
          <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="h-8 flex-1 rounded-md border border-border-default bg-bg-surface px-2 text-sm">
            <option value="">— Select a web category —</option>
            {webCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select value={newCategoryAction} onChange={(e) => setNewCategoryAction(e.target.value)} className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm">
            {POLICY_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <Button type="submit" size="sm">+ Add Rule</Button>
        </form>
        <ul className="divide-y divide-border-default text-sm">
          {!categories ? (
            <li className="px-3 py-3 text-center text-text-tertiary">Loading…</li>
          ) : categories.length === 0 ? (
            <li className="px-3 py-3 text-center text-text-tertiary">No web category rules — this policy relies on AD group scope only.</li>
          ) : (
            categories.map((c) => (
              <li key={c.policyCategoryId} className="flex items-center justify-between px-3 py-2">
                <span className="text-text-primary">{c.categoryNameEn} — <span className="font-medium">{c.policyAction}</span></span>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveCategory(c.policyCategoryId)}>Remove</Button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
