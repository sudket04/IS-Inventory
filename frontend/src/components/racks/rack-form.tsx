"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { Section, TextField, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyRackForm, type RackDetail, type RackForm as RackFormState } from "@/lib/racks/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

// Mirrors CHECK constraints in docs/database/11-module-v1.3b-details-rack-ipam.sql §5.
const NUMBERING_DIRECTIONS = ["BOTTOM_UP", "TOP_DOWN"];

export function RackForm({ existing }: { existing?: RackDetail }) {
  const router = useRouter();
  const locations = usePicker("locations");

  const [form, setForm] = React.useState<RackFormState>(() =>
    existing
      ? {
          locationId: String(existing.locationId),
          code: existing.code,
          name: existing.name,
          totalU: String(existing.totalU),
          widthMm: existing.widthMm != null ? String(existing.widthMm) : "",
          depthMm: existing.depthMm != null ? String(existing.depthMm) : "",
          maxWeightKg: existing.maxWeightKg != null ? String(existing.maxWeightKg) : "",
          maxPowerKw: existing.maxPowerKw != null ? String(existing.maxPowerKw) : "",
          numberingDirection: existing.numberingDirection,
          hasFrontDoor: existing.hasFrontDoor ?? false,
          hasRearDoor: existing.hasRearDoor ?? false,
          notes: existing.notes ?? "",
          isActive: existing.isActive,
        }
      : emptyRackForm
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      locationId: Number(form.locationId),
      code: form.code.trim(),
      name: form.name.trim(),
      totalU: Number(form.totalU),
      widthMm: num(form.widthMm),
      depthMm: num(form.depthMm),
      maxWeightKg: num(form.maxWeightKg),
      maxPowerKw: num(form.maxPowerKw),
      numberingDirection: form.numberingDirection,
      hasFrontDoor: form.hasFrontDoor,
      hasRearDoor: form.hasRearDoor,
      notes: str(form.notes),
      isActive: form.isActive,
    };

    const res = existing
      ? await apiFetch(`/api/racks/${existing.rackId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/racks", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/racks/${saved.rackId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the rack.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Basic Information">
        <TextField id="code" label="Code" required value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
        <TextField id="name" label="Name" required value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <SelectField id="locationId" label="Location" required value={form.locationId} onChange={(v) => setForm((f) => ({ ...f, locationId: v }))} options={locations} />
        <TextField id="totalU" label="Total U" type="number" required value={form.totalU} onChange={(v) => setForm((f) => ({ ...f, totalU: v }))} />
        <EnumSelectField id="numberingDirection" label="Numbering Direction" required options={NUMBERING_DIRECTIONS} value={form.numberingDirection} onChange={(v) => setForm((f) => ({ ...f, numberingDirection: v }))} />
        <CheckboxField id="isActive" label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
      </Section>

      <Section title="Physical">
        <TextField id="widthMm" label="Width (mm)" type="number" value={form.widthMm} onChange={(v) => setForm((f) => ({ ...f, widthMm: v }))} />
        <TextField id="depthMm" label="Depth (mm)" type="number" value={form.depthMm} onChange={(v) => setForm((f) => ({ ...f, depthMm: v }))} />
        <TextField id="maxWeightKg" label="Max Weight (kg)" type="number" value={form.maxWeightKg} onChange={(v) => setForm((f) => ({ ...f, maxWeightKg: v }))} />
        <TextField id="maxPowerKw" label="Max Power (kW)" type="number" value={form.maxPowerKw} onChange={(v) => setForm((f) => ({ ...f, maxPowerKw: v }))} />
        <CheckboxField id="hasFrontDoor" label="Has Front Door" checked={form.hasFrontDoor} onChange={(v) => setForm((f) => ({ ...f, hasFrontDoor: v }))} />
        <CheckboxField id="hasRearDoor" label="Has Rear Door" checked={form.hasRearDoor} onChange={(v) => setForm((f) => ({ ...f, hasRearDoor: v }))} />
      </Section>

      <Section title="Notes">
        <div className="col-span-full space-y-1.5">
          <textarea
            aria-label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="h-24 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/racks")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create Rack"}
        </Button>
      </div>
    </form>
  );
}
