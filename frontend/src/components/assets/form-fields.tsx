"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Option } from "@/lib/assets/types";

export function TextField({
  id, label, value, onChange, type = "text", required,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: "text" | "number" | "date"; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function SelectField({
  id, label, value, onChange, options, required, placeholder = "— None —",
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  options: Option[]; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EnumSelectField({
  id, label, value, onChange, options, required,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
      >
        <option value="">— None —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  id, label, checked, onChange,
}: {
  id: string; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 pt-6 text-sm text-text-primary">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border-strong"
      />
      {label}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-md border border-border-default p-4">
      <legend className="px-1 text-sm font-semibold text-text-primary">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}
