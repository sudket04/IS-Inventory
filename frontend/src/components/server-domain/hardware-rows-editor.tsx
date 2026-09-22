"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type CpuRequest, type MemoryRequest, type DiskRequest,
  DISK_TYPE_OPTIONS, MEMORY_TYPE_OPTIONS,
} from "@/lib/server-domain/types";
import { useNumberCatalog } from "@/lib/server-domain/options";

/** A number <select> backed by a live, admin/user-extensible catalog (CPU cores / RAM GB /
 * Storage GB) — "+ Add" persists a new value for every later selection, everywhere that
 * catalog is used, instead of a free-typed number that could let in bad data. */
function CatalogSelect({
  kind, value, onChange, unit, promptLabel, className,
}: {
  kind: "cpu-core-counts" | "ram-sizes" | "storage-sizes-gb"; value: number; onChange: (v: number) => void;
  unit: string; promptLabel: string; className?: string;
}) {
  const { values, add } = useNumberCatalog(kind);

  async function handleAdd() {
    const raw = window.prompt(promptLabel);
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    if (await add(n)) onChange(n);
  }

  return (
    <span className="inline-flex items-center gap-1">
      <select value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={className ?? "h-9 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary"}>
        {!values.includes(value) && <option value={value}>{value} {unit}</option>}
        {values.map((v) => <option key={v} value={v}>{v} {unit}</option>)}
      </select>
      <Button type="button" variant="ghost" size="icon" aria-label={promptLabel} title={promptLabel} onClick={handleAdd}>
        <Plus className="size-3.5" />
      </Button>
    </span>
  );
}

/** GB shown as TB once >=1000 — matches the "4.48 TB" style asked for, purely display-side;
 * everything is still stored/summed in GB underneath. */
function formatCapacity(gb: number): string {
  if (gb <= 0) return "0 GB";
  return gb >= 1000 ? `${(gb / 1000).toFixed(2).replace(/\.?0+$/, "")} TB` : `${gb} GB`;
}

function RowShell({ index, onRemove, children }: { index: number; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-default bg-bg-surface px-2.5 py-1.5">
      <span className="w-5 shrink-0 text-xs text-text-tertiary">[{index + 1}]</span>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function Wrapper({
  title, addLabel, totalLabel, onAdd, disabled, children,
}: { title: string; addLabel: string; totalLabel: string; onAdd: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <div className="space-y-1.5">{children}</div>
      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-3.5" /> {addLabel}
        </Button>
      )}
      <p className="text-xs text-text-tertiary">รวม: {totalLabel}</p>
    </div>
  );
}

export function CpuEditor({ value, onChange, disabled }: { value: CpuRequest[]; onChange: (v: CpuRequest[]) => void; disabled?: boolean }) {
  const totalCores = value.reduce((s, c) => s + (c.coreCount || 0), 0);

  function update(i: number, patch: Partial<CpuRequest>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <Wrapper title="CPU" addLabel="Add CPU" totalLabel={`${value.length} Socket / ${totalCores} Core`}
      disabled={disabled} onAdd={() => onChange([...value, { cpuModel: "", coreCount: 1 }])}>
      {value.length === 0 && <p className="text-xs text-text-tertiary">ยังไม่ได้เพิ่ม CPU</p>}
      {value.map((row, i) => (
        <RowShell key={i} index={i} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <Input disabled={disabled} placeholder="CPU Model เช่น Intel Xeon Gold 6248" value={row.cpuModel}
            onChange={(e) => update(i, { cpuModel: e.target.value })} className="min-w-[220px] flex-1" />
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            Cores:
            <CatalogSelect kind="cpu-core-counts" value={row.coreCount} unit="cores" promptLabel="Add a new CPU core count:"
              onChange={(v) => update(i, { coreCount: v })} className="h-8 w-24 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary" />
          </label>
        </RowShell>
      ))}
    </Wrapper>
  );
}

export function MemoryEditor({ value, onChange, disabled }: { value: MemoryRequest[]; onChange: (v: MemoryRequest[]) => void; disabled?: boolean }) {
  const totalGb = value.reduce((s, m) => s + (m.capacityGb || 0), 0);

  function update(i: number, patch: Partial<MemoryRequest>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <Wrapper title="Memory" addLabel="Add Memory" totalLabel={formatCapacity(totalGb)}
      disabled={disabled} onAdd={() => onChange([...value, { capacityGb: 8, memoryType: null }])}>
      {value.length === 0 && <p className="text-xs text-text-tertiary">ยังไม่ได้เพิ่ม Memory</p>}
      {value.map((row, i) => (
        <RowShell key={i} index={i} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <CatalogSelect kind="ram-sizes" value={row.capacityGb} unit="GB" promptLabel="Add a new RAM size (GB):"
            onChange={(v) => update(i, { capacityGb: v })} />
          <select disabled={disabled} value={row.memoryType ?? ""}
            onChange={(e) => update(i, { memoryType: e.target.value || null })}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
            <option value="">— Type —</option>
            {MEMORY_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </RowShell>
      ))}
    </Wrapper>
  );
}

export function DiskEditor({ value, onChange, disabled }: { value: DiskRequest[]; onChange: (v: DiskRequest[]) => void; disabled?: boolean }) {
  const totalGb = value.reduce((s, d) => s + (d.capacityGb || 0), 0);

  function update(i: number, patch: Partial<DiskRequest>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <Wrapper title="Storage" addLabel="Add Storage" totalLabel={formatCapacity(totalGb)}
      disabled={disabled} onAdd={() => onChange([...value, { diskLabel: "", capacityGb: 500, diskType: null }])}>
      {value.length === 0 && <p className="text-xs text-text-tertiary">ยังไม่ได้เพิ่ม Storage</p>}
      {value.map((row, i) => (
        <RowShell key={i} index={i} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <Input disabled={disabled} placeholder="Label เช่น OS, Data" value={row.diskLabel ?? ""}
            onChange={(e) => update(i, { diskLabel: e.target.value || null })} className="w-32" />
          <CatalogSelect kind="storage-sizes-gb" value={row.capacityGb} unit="GB" promptLabel="Add a new storage size (GB):"
            onChange={(v) => update(i, { capacityGb: v })} />
          <select disabled={disabled} value={row.diskType ?? ""}
            onChange={(e) => update(i, { diskType: e.target.value || null })}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
            <option value="">— Type —</option>
            {DISK_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </RowShell>
      ))}
    </Wrapper>
  );
}
