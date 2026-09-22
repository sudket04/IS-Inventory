"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, EnumSelectField, CheckboxField, Section } from "@/components/assets/form-fields";
import { useAssetFormOptions } from "@/lib/assets/options";
import { useAssetTypes } from "@/lib/server-domain/options";
import { CpuEditor, MemoryEditor, DiskEditor } from "@/components/server-domain/hardware-rows-editor";
import { CRITICALITY_OPTIONS } from "@/lib/server-domain/types";
import type { ServerInventoryDetail, ServerInventoryRequest, CpuRequest, MemoryRequest, DiskRequest } from "@/lib/server-domain/types";

type CategoryChoice = "SRV" | "STG";

export function ServerInventoryForm({ existing }: { existing?: ServerInventoryDetail }) {
  const router = useRouter();
  const { categories, statuses, manufacturers, vendors, locations, departments, users } = useAssetFormOptions();

  const [category, setCategory] = React.useState<CategoryChoice | "">(
    existing ? (existing.categoryCode as CategoryChoice) : ""
  );
  const assetTypes = useAssetTypes(category || "SRV", category === "SRV" ? false : undefined);

  const [core, setCore] = React.useState({
    assetTypeId: existing?.assetTypeId?.toString() ?? "",
    name: existing?.name ?? "",
    manufacturerId: existing?.manufacturerId?.toString() ?? "",
    model: existing?.model ?? "",
    serialNumber: existing?.serialNumber ?? "",
    statusId: existing?.statusId?.toString() ?? "",
    locationId: existing?.locationId?.toString() ?? "",
    departmentId: existing?.departmentId?.toString() ?? "",
    ownerUserId: existing?.ownerUserId?.toString() ?? "",
    vendorId: existing?.vendorId?.toString() ?? "",
    poNumber: existing?.poNumber ?? "",
    purchaseDate: existing?.purchaseDate ?? "",
    purchasePrice: existing?.purchasePrice?.toString() ?? "",
    fixedAssetNo: existing?.fixedAssetNo ?? "",
    serviceTag: existing?.serviceTag ?? "",
    costCenter: existing?.costCenter ?? "",
    notes: existing?.notes ?? "",
  });

  const [srv, setSrv] = React.useState({
    hostname: existing?.hostname ?? "",
    macAddress: existing?.macAddress ?? "",
    osInstallDate: existing?.osInstallDate ?? "",
    lastPatchDate: existing?.lastPatchDate ?? "",
    criticality: existing?.criticality ?? "",
  });
  const [cpus, setCpus] = React.useState<CpuRequest[]>(existing?.cpus?.map((c) => ({ cpuModel: c.cpuModel, coreCount: c.coreCount })) ?? []);
  const [memory, setMemory] = React.useState<MemoryRequest[]>(existing?.memoryModules?.map((m) => ({ capacityGb: m.capacityGb, memoryType: m.memoryType })) ?? []);
  const [disks, setDisks] = React.useState<DiskRequest[]>(existing?.localDisks?.map((d) => ({ diskLabel: d.diskLabel, capacityGb: d.capacityGb, diskType: d.diskType })) ?? []);

  const [stg, setStg] = React.useState({
    mgmtUrl: existing?.storageMgmtUrl ?? "",
    controllerCount: existing?.controllerCount?.toString() ?? "",
    diskBayTotal: existing?.diskBayTotal?.toString() ?? "",
    diskBayUsed: existing?.diskBayUsed?.toString() ?? "",
    rawCapacityTb: existing?.rawCapacityTb?.toString() ?? "",
    usableCapacityTb: existing?.usableCapacityTb?.toString() ?? "",
    cacheGb: existing?.cacheGb?.toString() ?? "",
    supportedProtocols: existing?.supportedProtocols ?? "",
    hasDedup: existing?.hasDedup ?? false, hasCompression: existing?.hasCompression ?? false,
    hasSnapshot: existing?.hasSnapshot ?? false, hasReplication: existing?.hasReplication ?? false,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function num(v: string): number | null {
    const n = Number(v);
    return v.trim() === "" || Number.isNaN(n) ? null : n;
  }
  function str(v: string): string | null {
    return v.trim() === "" ? null : v.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      setError("เลือก Asset Type ก่อน (Server หรือ Storage)");
      return;
    }
    setSubmitting(true);
    setError(null);

    const categoryId = categories.find((c) => c.label === (category === "SRV" ? "Server" : "Storage"))?.id;
    if (!categoryId || !core.assetTypeId || !core.statusId) {
      setError("กรอกข้อมูลที่จำเป็นให้ครบ");
      setSubmitting(false);
      return;
    }

    const body: ServerInventoryRequest = {
      categoryId, assetTypeId: Number(core.assetTypeId), name: core.name.trim(),
      manufacturerId: core.manufacturerId ? Number(core.manufacturerId) : null,
      model: str(core.model), serialNumber: str(core.serialNumber),
      statusId: Number(core.statusId),
      locationId: core.locationId ? Number(core.locationId) : null,
      departmentId: core.departmentId ? Number(core.departmentId) : null,
      ownerUserId: core.ownerUserId ? Number(core.ownerUserId) : null,
      vendorId: core.vendorId ? Number(core.vendorId) : null,
      poNumber: str(core.poNumber), purchaseDate: str(core.purchaseDate), purchasePrice: num(core.purchasePrice), currency: "THB",
      receivedDate: null, installDate: null, serviceStartDate: null,
      fixedAssetNo: str(core.fixedAssetNo), serviceTag: str(core.serviceTag), systemUuid: null,
      costCenter: str(core.costCenter), notes: str(core.notes),
      hostname: category === "SRV" ? str(srv.hostname) : null,
      macAddress: category === "SRV" ? str(srv.macAddress) : null,
      osInstallDate: category === "SRV" ? str(srv.osInstallDate) : null,
      lastPatchDate: category === "SRV" ? str(srv.lastPatchDate) : null,
      criticality: category === "SRV" ? str(srv.criticality) : null,
      cpus: category === "SRV" ? cpus : null,
      memoryModules: category === "SRV" ? memory : null,
      localDisks: category === "SRV" ? disks : null,
      storageMgmtUrl: category === "STG" ? str(stg.mgmtUrl) : null,
      controllerCount: category === "STG" ? (num(stg.controllerCount) as number | null) : null,
      diskBayTotal: category === "STG" ? (num(stg.diskBayTotal) as number | null) : null,
      diskBayUsed: category === "STG" ? (num(stg.diskBayUsed) as number | null) : null,
      rawCapacityTb: category === "STG" ? num(stg.rawCapacityTb) : null,
      usableCapacityTb: category === "STG" ? num(stg.usableCapacityTb) : null,
      cacheGb: category === "STG" ? (num(stg.cacheGb) as number | null) : null,
      supportedProtocols: category === "STG" ? str(stg.supportedProtocols) : null,
      hasDedup: category === "STG" ? stg.hasDedup : null,
      hasCompression: category === "STG" ? stg.hasCompression : null,
      hasSnapshot: category === "STG" ? stg.hasSnapshot : null,
      hasReplication: category === "STG" ? stg.hasReplication : null,
    };

    const res = existing
      ? await apiFetch(`/api/server-inventory/${existing.assetId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/server-inventory", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/server-inventory/${saved.assetId}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Asset Type">
        <EnumSelectField id="category" label="Asset Type" required placeholder="— Select —"
          value={category} onChange={(v) => setCategory(v as CategoryChoice)}
          options={[{ value: "SRV", label: "Server" }, { value: "STG", label: "Storage" }]} />
        {category && (
          <SelectField id="assetType" label={category === "SRV" ? "Server Type" : "Storage Type"} required
            value={core.assetTypeId} onChange={(v) => setCore((c) => ({ ...c, assetTypeId: v }))}
            options={assetTypes.map((t) => ({ id: t.id, label: t.name }))} placeholder="— Select —" />
        )}
      </Section>

      {category && (
        <>
          <Section title="System Info">
            <TextField id="name" label="Name" required value={core.name} onChange={(v) => setCore((c) => ({ ...c, name: v }))} />
            <SelectField id="manufacturer" label="Manufacturer" value={core.manufacturerId} onChange={(v) => setCore((c) => ({ ...c, manufacturerId: v }))} options={manufacturers} />
            <TextField id="model" label="Model" value={core.model} onChange={(v) => setCore((c) => ({ ...c, model: v }))} />
            <TextField id="serial" label="Serial Number" value={core.serialNumber} onChange={(v) => setCore((c) => ({ ...c, serialNumber: v }))} />
            <TextField id="serviceTag" label="Service Tag" value={core.serviceTag} onChange={(v) => setCore((c) => ({ ...c, serviceTag: v }))} />
          </Section>

          <Section title="Location">
            <SelectField id="location" label="Location" value={core.locationId} onChange={(v) => setCore((c) => ({ ...c, locationId: v }))} options={locations} />
            <SelectField id="department" label="Department" value={core.departmentId} onChange={(v) => setCore((c) => ({ ...c, departmentId: v }))} options={departments} />
          </Section>

          <Section title="Lifecycle">
            <TextField id="purchaseDate" label="Purchase Date" type="date" value={core.purchaseDate} onChange={(v) => setCore((c) => ({ ...c, purchaseDate: v }))} />
            <TextField id="fixedAssetNo" label="Fixed Asset No." value={core.fixedAssetNo} onChange={(v) => setCore((c) => ({ ...c, fixedAssetNo: v }))} />
            <SelectField id="status" label="Status" required value={core.statusId} onChange={(v) => setCore((c) => ({ ...c, statusId: v }))} options={statuses} placeholder="— Select —" />
            {existing?.warrantyUntil && (
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-text-secondary">Warranty Until</span>
                <p className="text-sm text-text-primary">{existing.warrantyUntil} <span className="text-xs text-text-tertiary">(จาก Contracts)</span></p>
              </div>
            )}
          </Section>

          <Section title="Other">
            <SelectField id="owner" label="Owner" value={core.ownerUserId} onChange={(v) => setCore((c) => ({ ...c, ownerUserId: v }))} options={users} />
            <SelectField id="vendor" label="Vendor" value={core.vendorId} onChange={(v) => setCore((c) => ({ ...c, vendorId: v }))} options={vendors} />
            <TextField id="costCenter" label="Cost Center" value={core.costCenter} onChange={(v) => setCore((c) => ({ ...c, costCenter: v }))} />
          </Section>

          {category === "SRV" && (
            <div className="rounded-md border border-border-default p-4">
              <h2 className="mb-3 text-sm font-semibold text-text-primary">Server Hardware</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <TextField id="hostname" label="Hostname" value={srv.hostname} onChange={(v) => setSrv((s) => ({ ...s, hostname: v }))} />
                <TextField id="macAddress" label="MAC Address" value={srv.macAddress} onChange={(v) => setSrv((s) => ({ ...s, macAddress: v }))} />
                <EnumSelectField id="criticality" label="Criticality" value={srv.criticality} onChange={(v) => setSrv((s) => ({ ...s, criticality: v }))}
                  options={CRITICALITY_OPTIONS} />
                <TextField id="osInstallDate" label="OS Install Date" type="date" value={srv.osInstallDate} onChange={(v) => setSrv((s) => ({ ...s, osInstallDate: v }))} />
                <TextField id="lastPatchDate" label="Last Patch Date" type="date" value={srv.lastPatchDate} onChange={(v) => setSrv((s) => ({ ...s, lastPatchDate: v }))} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <CpuEditor value={cpus} onChange={setCpus} />
                <MemoryEditor value={memory} onChange={setMemory} />
                <DiskEditor value={disks} onChange={setDisks} />
              </div>
            </div>
          )}

          {category === "STG" && (
            <Section title="Storage Array">
              <TextField id="mgmtUrl" label="Management URL" value={stg.mgmtUrl} onChange={(v) => setStg((s) => ({ ...s, mgmtUrl: v }))} />
              <TextField id="controllerCount" label="Controller Count" type="number" value={stg.controllerCount} onChange={(v) => setStg((s) => ({ ...s, controllerCount: v }))} />
              <TextField id="diskBayTotal" label="Disk Bay Total" type="number" value={stg.diskBayTotal} onChange={(v) => setStg((s) => ({ ...s, diskBayTotal: v }))} />
              <TextField id="diskBayUsed" label="Disk Bay Used" type="number" value={stg.diskBayUsed} onChange={(v) => setStg((s) => ({ ...s, diskBayUsed: v }))} />
              <TextField id="rawCapacityTb" label="Raw Capacity (TB)" type="number" value={stg.rawCapacityTb} onChange={(v) => setStg((s) => ({ ...s, rawCapacityTb: v }))} />
              <TextField id="usableCapacityTb" label="Usable Capacity (TB)" type="number" value={stg.usableCapacityTb} onChange={(v) => setStg((s) => ({ ...s, usableCapacityTb: v }))} />
              <TextField id="cacheGb" label="Cache (GB)" type="number" value={stg.cacheGb} onChange={(v) => setStg((s) => ({ ...s, cacheGb: v }))} />
              <TextField id="supportedProtocols" label="Supported Protocols" value={stg.supportedProtocols} onChange={(v) => setStg((s) => ({ ...s, supportedProtocols: v }))} />
              <CheckboxField id="hasDedup" label="Deduplication" checked={stg.hasDedup} onChange={(v) => setStg((s) => ({ ...s, hasDedup: v }))} />
              <CheckboxField id="hasCompression" label="Compression" checked={stg.hasCompression} onChange={(v) => setStg((s) => ({ ...s, hasCompression: v }))} />
              <CheckboxField id="hasSnapshot" label="Snapshot" checked={stg.hasSnapshot} onChange={(v) => setStg((s) => ({ ...s, hasSnapshot: v }))} />
              <CheckboxField id="hasReplication" label="Replication" checked={stg.hasReplication} onChange={(v) => setStg((s) => ({ ...s, hasReplication: v }))} />
            </Section>
          )}

          <Section title="Remarks">
            <div className="sm:col-span-2 lg:col-span-3">
              <textarea value={core.notes} onChange={(e) => setCore((c) => ({ ...c, notes: e.target.value }))}
                className="h-20 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary" />
            </div>
          </Section>
        </>
      )}

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={submitting || !category}>{submitting ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
