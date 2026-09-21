"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Section, TextField, CheckboxField } from "@/components/assets/form-fields";
import { emptyInternetPolicyForm, type InternetPolicyDetail, type InternetPolicyForm as InternetPolicyFormState } from "@/lib/permission-control/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());

export function InternetPolicyForm({ existing }: { existing?: InternetPolicyDetail }) {
  const router = useRouter();

  const [form, setForm] = React.useState<InternetPolicyFormState>(() =>
    existing
      ? {
          policyCode: existing.policyCode,
          policyName: existing.policyName,
          description: existing.description ?? "",
          externalPolicyRef: existing.externalPolicyRef ?? "",
          isDefault: existing.isDefault,
          isActive: existing.isActive,
          notes: existing.notes ?? "",
        }
      : emptyInternetPolicyForm
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      policyCode: form.policyCode.trim(),
      policyName: form.policyName.trim(),
      description: str(form.description),
      externalPolicyRef: str(form.externalPolicyRef),
      isDefault: form.isDefault,
      isActive: form.isActive,
      notes: str(form.notes),
    };

    const res = existing
      ? await apiFetch(`/api/internet-policies/${existing.policyId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/internet-policies", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/internet-policies/${saved.policyId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the policy.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Policy">
        <TextField id="policyCode" label="Policy Code" required value={form.policyCode} onChange={(v) => setForm((f) => ({ ...f, policyCode: v }))} />
        <TextField id="policyName" label="Policy Name" required value={form.policyName} onChange={(v) => setForm((f) => ({ ...f, policyName: v }))} />
        <TextField id="externalPolicyRef" label="Proxy-side Policy Name (for cross-reference)" value={form.externalPolicyRef} onChange={(v) => setForm((f) => ({ ...f, externalPolicyRef: v }))} />
        <CheckboxField id="isDefault" label="Default Policy" checked={form.isDefault} onChange={(v) => setForm((f) => ({ ...f, isDefault: v }))} />
        <CheckboxField id="isActive" label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
        <div className="col-span-full space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="h-16 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      <Section title="Notes">
        <div className="col-span-full space-y-1.5">
          <textarea
            aria-label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="h-16 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/internet-policies")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create Policy"}
        </Button>
      </div>
    </form>
  );
}
