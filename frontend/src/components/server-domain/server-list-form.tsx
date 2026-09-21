"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, EnumSelectField, Section } from "@/components/assets/form-fields";
import { useAssetFormOptions } from "@/lib/assets/options";
import { useAvailableHardware, useClusters, useServerStatuses } from "@/lib/server-domain/options";
import { CpuEditor, MemoryEditor, DiskEditor } from "@/components/server-domain/hardware-rows-editor";
import { OsCatalogFields } from "@/components/server-domain/os-catalog-fields";
import { usePicker } from "@/lib/assets/options";
import { CRITICALITY_OPTIONS, ENVIRONMENT_OPTIONS } from "@/lib/server-domain/types";
import type { ServerListDetail, ServerListCreateRequest, ServerListUpdateRequest, CpuRequest, MemoryRequest, DiskRequest } from "@/lib/server-domain/types";

export function ServerListForm({ existing }: { existing?: ServerListDetail }) {
  const router = useRouter();
  const { locations, departments, users } = useAssetFormOptions();
  const clusters = useClusters();
  const serverStatuses = useServerStatuses();
  const networkZones = usePicker("network-zones");
  const availableHardware = useAvailableHardware();

  const isVirtual = existing ? existing.isVirtual : null; // decided by hosting-type pick for new, fixed for existing
  const [hostingChoice, setHostingChoice] = React.useState<"Virtual" | "Physical" | "">(
    existing ? (existing.isVirtual ? "Virtual" : "Physical") : ""
  );
  const [hardwareAssetId, setHardwareAssetId] = React.useState("");

  const [form, setForm] = React.useState({
    name: existing?.name ?? "",
    statusId: existing?.statusId?.toString() ?? "",
    locationId: existing?.locationId?.toString() ?? "",
    departmentId: existing?.departmentId?.toString() ?? "",
    ownerUserId: existing?.ownerUserId?.toString() ?? "",
    notes: existing?.notes ?? "",
    hostname: existing?.hostname ?? "",
    macAddress: existing?.macAddress ?? "",
    osInstallDate: existing?.osInstallDate ?? "",
    lastPatchDate: existing?.lastPatchDate ?? "",
    clusterId: existing?.clusterId?.toString() ?? "",
    systemGroup: existing?.systemGroup ?? "",
    fqdn: existing?.fqdn ?? "",
    serverZoneId: existing?.serverZoneId?.toString() ?? "",
    environment: existing?.environment ?? "PRODUCTION",
    criticality: existing?.criticality ?? "",
    serverStatusId: existing?.serverStatusId?.toString() ?? "",
    primaryIpAddress: existing?.primaryIpAddress ?? "",
    managementIpAddress: existing?.managementIpAddress ?? "",
  });
  const [osTypeId, setOsTypeId] = React.useState<number | null>(existing?.osTypeId ?? null);
  const [osVersionId, setOsVersionId] = React.useState<number | null>(existing?.osVersionId ?? null);

  const [cpus, setCpus] = React.useState<CpuRequest[]>(existing?.cpus.map((c) => ({ cpuModel: c.cpuModel, coreCount: c.coreCount })) ?? []);
  const [memory, setMemory] = React.useState<MemoryRequest[]>(existing?.memoryModules.map((m) => ({ capacityGb: m.capacityGb, memoryType: m.memoryType })) ?? []);
  const [disks, setDisks] = React.useState<DiskRequest[]>(existing?.localDisks.map((d) => ({ diskLabel: d.diskLabel, capacityGb: d.capacityGb, diskType: d.diskType })) ?? []);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveVirtual = existing ? isVirtual : hostingChoice === "Virtual";

  function str(v: string): string | null { return v.trim() === "" ? null : v.trim(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!existing && !hostingChoice) {
      setError("เลือก Hosting Type ก่อน (Virtual หรือ Physical)");
      return;
    }
    if (effectiveVirtual && !form.clusterId) {
      setError("Virtual Server ต้องเลือก Cluster");
      return;
    }
    if (!existing && hostingChoice === "Physical" && !hardwareAssetId) {
      setError("เลือกเครื่องจาก Server Inventory ก่อน");
      return;
    }
    if (!form.serverStatusId) {
      setError("เลือก Status");
      return;
    }

    setSubmitting(true);

    const common = {
      statusId: form.statusId ? Number(form.statusId) : null,
      locationId: form.locationId ? Number(form.locationId) : null,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      ownerUserId: form.ownerUserId ? Number(form.ownerUserId) : null,
      notes: str(form.notes),
      hostname: str(form.hostname), macAddress: str(form.macAddress),
      osInstallDate: str(form.osInstallDate), lastPatchDate: str(form.lastPatchDate),
      clusterId: form.clusterId ? Number(form.clusterId) : null,
      systemGroup: str(form.systemGroup), fqdn: str(form.fqdn),
      serverZoneId: form.serverZoneId ? Number(form.serverZoneId) : null,
      environment: form.environment, criticality: str(form.criticality),
      serverStatusId: Number(form.serverStatusId),
      osTypeId, osVersionId,
      primaryIpAddress: str(form.primaryIpAddress), managementIpAddress: str(form.managementIpAddress),
      cpus: effectiveVirtual ? cpus : null,
      memoryModules: effectiveVirtual ? memory : null,
      localDisks: effectiveVirtual ? disks : null,
    };

    let res: Response;
    if (existing) {
      const body: ServerListUpdateRequest = { name: str(form.name), ...common } as ServerListUpdateRequest;
      res = await apiFetch(`/api/server-list/${existing.assetId}`, { method: "PUT", body: JSON.stringify(body) });
    } else {
      const body: ServerListCreateRequest = {
        isVirtual: hostingChoice === "Virtual",
        hardwareAssetId: hostingChoice === "Physical" ? Number(hardwareAssetId) : null,
        name: hostingChoice === "Virtual" ? form.name.trim() : null,
        ...common,
      };
      res = await apiFetch("/api/server-list", { method: "POST", body: JSON.stringify(body) });
    }

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/server-list/${saved.assetId}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Hosting Type">
        {existing ? (
          <p className="text-sm text-text-primary sm:col-span-2 lg:col-span-3">
            {existing.isVirtual ? "Virtual" : "Physical"} <span className="text-xs text-text-tertiary">(เปลี่ยนแปลงไม่ได้หลังสร้างแล้ว)</span>
          </p>
        ) : (
          <>
            <EnumSelectField id="hostingType" label="Hosting Type" required placeholder="— Select —"
              value={hostingChoice} onChange={(v) => setHostingChoice(v as "Virtual" | "Physical")}
              options={["Virtual", "Physical"]} />
            {hostingChoice === "Physical" && (
              <SelectField id="hardwareAsset" label="Hardware (จาก Server Inventory)" required
                value={hardwareAssetId} onChange={setHardwareAssetId}
                options={availableHardware.map((h) => ({ id: h.assetId, label: `${h.assetTag} — ${[h.manufacturerName, h.model].filter(Boolean).join(" ")} (${h.serialNumber ?? "no S/N"})` }))}
                placeholder="— Select —" />
            )}
          </>
        )}
      </Section>

      {(existing || hostingChoice) && (
        <>
          <Section title="System Info">
            {hostingChoice === "Virtual" || (existing && existing.isVirtual) ? (
              <TextField id="name" label="System Name" required value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            ) : (
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-text-secondary">System Name</span>
                <p className="text-sm text-text-primary">{existing?.name ?? "(จาก Hardware ที่เลือก)"}</p>
              </div>
            )}
            <TextField id="systemGroup" label="System Group" value={form.systemGroup} onChange={(v) => setForm((f) => ({ ...f, systemGroup: v }))} />
            <TextField id="hostname" label="Server Name (Hostname)" value={form.hostname} onChange={(v) => setForm((f) => ({ ...f, hostname: v }))} />
            <TextField id="fqdn" label="FQDN" value={form.fqdn} onChange={(v) => setForm((f) => ({ ...f, fqdn: v }))} />
          </Section>

          <Section title="Operating System">
            <div className="sm:col-span-2 lg:col-span-3">
              <OsCatalogFields osTypeId={osTypeId} osVersionId={osVersionId} onChange={(t, v) => { setOsTypeId(t); setOsVersionId(v); }} />
            </div>
          </Section>

          {effectiveVirtual && (
            <Section title="Cluster">
              <SelectField id="cluster" label="Cluster" required value={form.clusterId} onChange={(v) => setForm((f) => ({ ...f, clusterId: v }))} options={clusters} placeholder="— Select —" />
            </Section>
          )}

          <Section title="Network">
            <TextField id="primaryIp" label="IP Address" value={form.primaryIpAddress} onChange={(v) => setForm((f) => ({ ...f, primaryIpAddress: v }))} />
            <TextField id="mgmtIp" label="IP Management (iDRAC/iLO)" value={form.managementIpAddress} onChange={(v) => setForm((f) => ({ ...f, managementIpAddress: v }))} />
            <SelectField id="serverZone" label="Server Zone" value={form.serverZoneId} onChange={(v) => setForm((f) => ({ ...f, serverZoneId: v }))} options={networkZones} />
          </Section>

          <Section title="Lifecycle">
            <EnumSelectField id="environment" label="Environment" required value={form.environment} onChange={(v) => setForm((f) => ({ ...f, environment: v }))} options={[...ENVIRONMENT_OPTIONS]} />
            <SelectField id="serverStatus" label="Status" required value={form.serverStatusId} onChange={(v) => setForm((f) => ({ ...f, serverStatusId: v }))} options={serverStatuses} placeholder="— Select —" />
            {effectiveVirtual ? (
              <EnumSelectField id="criticality" label="Criticality" value={form.criticality} onChange={(v) => setForm((f) => ({ ...f, criticality: v }))}
                options={CRITICALITY_OPTIONS} />
            ) : (
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-text-secondary">Criticality</span>
                <p className="text-sm text-text-primary">{existing?.criticality ?? "(จาก Hardware)"} <span className="text-xs text-text-tertiary">(แก้ที่ Server Inventory)</span></p>
              </div>
            )}
          </Section>

          <Section title="Other">
            <SelectField id="location" label="Location" value={form.locationId} onChange={(v) => setForm((f) => ({ ...f, locationId: v }))} options={locations} />
            <SelectField id="department" label="Department" value={form.departmentId} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={departments} />
            <SelectField id="owner" label="Owner" value={form.ownerUserId} onChange={(v) => setForm((f) => ({ ...f, ownerUserId: v }))} options={users} />
          </Section>

          {effectiveVirtual ? (
            <div className="rounded-md border border-border-default p-4">
              <h2 className="mb-3 text-sm font-semibold text-text-primary">CPU / Memory / Storage</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <CpuEditor value={cpus} onChange={setCpus} />
                <MemoryEditor value={memory} onChange={setMemory} />
                <DiskEditor value={disks} onChange={setDisks} />
              </div>
            </div>
          ) : existing?.hardwareSummary ? (
            <div className="rounded-md border border-border-default p-4">
              <h2 className="mb-3 text-sm font-semibold text-text-primary">
                CPU / Memory / Storage <span className="text-xs font-normal text-text-tertiary">(อ่านอย่างเดียว — จาก Server Inventory)</span>
              </h2>
              <p className="text-sm text-text-secondary">
                {existing.hardwareSummary.cpuSocketCount} Socket / {existing.hardwareSummary.cpuTotalCores} Core ·
                {" "}{existing.hardwareSummary.totalRamGb} GB RAM ·
                {" "}{existing.hardwareSummary.totalStorageGb} GB Storage
              </p>
              <ul className="mt-2 space-y-1 text-xs text-text-tertiary">
                {existing.cpus.map((c) => <li key={c.id}>{c.cpuModel} — {c.coreCount} Core</li>)}
                {existing.memoryModules.map((m) => <li key={m.id}>{m.capacityGb} GB {m.memoryType ?? ""}</li>)}
                {existing.localDisks.map((d) => <li key={d.id}>{d.diskLabel ?? "Disk"}: {d.capacityGb} GB {d.diskType ?? ""}</li>)}
              </ul>
            </div>
          ) : null}

          <Section title="Remarks">
            <div className="sm:col-span-2 lg:col-span-3">
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="h-20 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary" />
            </div>
          </Section>
        </>
      )}

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
