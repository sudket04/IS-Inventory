"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LookupConfig, LookupRow } from "@/lib/lookups/types";

interface LookupFormDialogProps {
  config: LookupConfig;
  /** Present when editing an existing row; absent when creating. */
  initial?: LookupRow;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<string | null>;
}

function initialValues(config: LookupConfig, initial?: LookupRow): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (initial && field.key in initial) {
      values[field.key] = initial[field.key];
    } else {
      values[field.key] = field.type === "checkbox" ? false : field.type === "number" ? 0 : "";
    }
  }
  return values;
}

export function LookupFormDialog({ config, initial, onCancel, onSubmit }: LookupFormDialogProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>(() => initialValues(config, initial));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(await onSubmit(values));
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border-default bg-bg-surface p-5 shadow-lg">
        <h2 className="text-base font-semibold text-text-primary">
          {initial ? `Edit ${config.title}` : `Add ${config.title}`}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {config.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              {field.type !== "checkbox" && <Label htmlFor={field.key}>{field.label}</Label>}

              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  required={field.required}
                  value={String(values[field.key] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="h-20 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
                />
              ) : field.type === "select" ? (
                <select
                  id={field.key}
                  required={field.required}
                  value={String(values[field.key] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    id={field.key}
                    type="checkbox"
                    checked={Boolean(values[field.key])}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.checked }))}
                    className="size-4 rounded border-border-strong"
                  />
                  {field.label}
                </label>
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  required={field.required}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  value={String(values[field.key] ?? "")}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              )}

              {field.helpText && <p className="text-xs text-text-tertiary">{field.helpText}</p>}
            </div>
          ))}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
