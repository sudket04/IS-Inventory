"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClusters, useUsedWith } from "@/lib/server-domain/options";
import { usePicker } from "@/lib/assets/options";

/** Storage Hardware "Used With" — a flat multi-select of Cluster(s)/Server(s) this Storage
 * asset serves, saved immediately on each change (no separate form submit — matches how the
 * rest of the Server Inventory edit page treats sub-resources like the Storage Volumes panel).
 * The Server picker reuses api/pickers/file-servers, which is already scoped to category SRV
 * despite the name — no need for a second, redundant "all Server assets" endpoint. */
export function UsedWithPanel({ assetId }: { assetId: number }) {
  const clusters = useClusters();
  const servers = usePicker("file-servers");
  const { items, save } = useUsedWith(assetId);
  const [pending, setPending] = React.useState(false);
  const [addType, setAddType] = React.useState<"cluster" | "server">("cluster");
  const [addId, setAddId] = React.useState("");

  async function handleAdd() {
    if (!addId) return;
    const id = Number(addId);
    if (items.some((i) => i.type === addType && i.id === id)) return;
    setPending(true);
    await save([...items.map((i) => ({ type: i.type, id: i.id })), { type: addType, id }]);
    setPending(false);
    setAddId("");
  }

  async function handleRemove(type: "cluster" | "server", id: number) {
    setPending(true);
    await save(items.filter((i) => !(i.type === type && i.id === id)).map((i) => ({ type: i.type, id: i.id })));
    setPending(false);
  }

  const options = addType === "cluster" ? clusters : servers;

  return (
    <div className="rounded-md border border-border-default p-4">
      <h2 className="mb-1 text-sm font-semibold text-text-primary">Used With (Cluster / Server)</h2>
      <p className="mb-3 text-xs text-text-tertiary">อุปกรณ์ Storage นี้ถูกใช้งานร่วมกับ Cluster/Server เครื่องใดบ้าง</p>

      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <p className="text-xs text-text-tertiary">ยังไม่ได้ระบุ</p>}
        {items.map((i) => (
          <span key={`${i.type}-${i.id}`} className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-subtle px-2.5 py-1 text-xs text-text-primary">
            <span className="text-text-tertiary">[{i.type === "cluster" ? "Cluster" : "Server"}]</span> {i.label}
            <button type="button" disabled={pending} aria-label="Remove" onClick={() => handleRemove(i.type, i.id)}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select value={addType} onChange={(e) => { setAddType(e.target.value as "cluster" | "server"); setAddId(""); }}
          className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
          <option value="cluster">Cluster</option>
          <option value="server">Server</option>
        </select>
        <select value={addId} onChange={(e) => setAddId(e.target.value)}
          className="h-8 flex-1 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary">
          <option value="">— Select —</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <Button type="button" size="sm" disabled={pending || !addId} onClick={handleAdd}>+ Add</Button>
      </div>
    </div>
  );
}
