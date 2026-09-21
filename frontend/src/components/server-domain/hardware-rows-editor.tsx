"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type CpuRequest, type MemoryRequest, type DiskRequest,
  DISK_TYPE_OPTIONS, MEMORY_TYPE_OPTIONS, RAM_SIZE_OPTIONS_GB, STORAGE_SIZE_OPTIONS_GB,
} from "@/lib/server-domain/types";

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
            <Input disabled={disabled} type="number" min={1} max={128} value={row.coreCount}
              onChange={(e) => update(i, { coreCount: Math.max(1, Math.min(128, Number(e.target.value) || 1)) })}
              className="w-20" />
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
          <select disabled={disabled} value={row.capacityGb}
            onChange={(e) => update(i, { capacityGb: Number(e.target.value) })}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
            {RAM_SIZE_OPTIONS_GB.map((gb) => <option key={gb} value={gb}>{gb} GB</option>)}
          </select>
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
          <select disabled={disabled} value={row.capacityGb}
            onChange={(e) => update(i, { capacityGb: Number(e.target.value) })}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
            {STORAGE_SIZE_OPTIONS_GB.map((gb) => <option key={gb} value={gb}>{formatCapacity(gb)}</option>)}
            {!STORAGE_SIZE_OPTIONS_GB.includes(row.capacityGb) && <option value={row.capacityGb}>{formatCapacity(row.capacityGb)} (Custom)</option>}
          </select>
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
