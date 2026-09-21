"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOsCatalog } from "@/lib/server-domain/options";

/** OS Type + OS Version, cascading, both addable inline with a "+" — the one Master Data
 * pair in the app that skips Admin > Master Data, per explicit user request. */
export function OsCatalogFields({
  osTypeId, osVersionId, onChange,
}: { osTypeId: number | null; osVersionId: number | null; onChange: (osTypeId: number | null, osVersionId: number | null) => void }) {
  const { types, versions, loadVersions, addType, addVersion } = useOsCatalog();
  const [addingType, setAddingType] = React.useState(false);
  const [addingVersion, setAddingVersion] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");
  const [newVersionName, setNewVersionName] = React.useState("");

  React.useEffect(() => {
    if (osTypeId) loadVersions(osTypeId);
  }, [osTypeId, loadVersions]);

  async function submitNewType() {
    const name = newTypeName.trim();
    if (!name) return;
    const created = await addType(name);
    if (created) {
      onChange(created.id, null);
      setNewTypeName("");
      setAddingType(false);
    }
  }

  async function submitNewVersion() {
    const name = newVersionName.trim();
    if (!name || !osTypeId) return;
    const created = await addVersion(osTypeId, name);
    if (created) {
      onChange(osTypeId, created.id);
      setNewVersionName("");
      setAddingVersion(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="os-type">OS Type</Label>
        {addingType ? (
          <div className="flex gap-1.5">
            <Input id="os-type-new" autoFocus placeholder="เช่น FreeBSD" value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submitNewType())} />
            <Button type="button" size="sm" onClick={submitNewType}>Add</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingType(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <select id="os-type" value={osTypeId ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null, null)}
              className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary">
              <option value="">— Select —</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Button type="button" variant="outline" size="icon" aria-label="Add OS Type" onClick={() => setAddingType(true)}>
              <Plus className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="os-version">OS Version</Label>
        {addingVersion ? (
          <div className="flex gap-1.5">
            <Input id="os-version-new" autoFocus placeholder="เช่น Windows Server 2025" value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submitNewVersion())} />
            <Button type="button" size="sm" onClick={submitNewVersion}>Add</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingVersion(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <select id="os-version" disabled={!osTypeId} value={osVersionId ?? ""}
              onChange={(e) => onChange(osTypeId, e.target.value ? Number(e.target.value) : null)}
              className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary disabled:opacity-50">
              <option value="">— Select —</option>
              {versions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <Button type="button" variant="outline" size="icon" aria-label="Add OS Version" disabled={!osTypeId} onClick={() => setAddingVersion(true)}>
              <Plus className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
