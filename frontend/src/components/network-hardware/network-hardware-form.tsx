"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, CheckboxField, Section } from "@/components/assets/form-fields";
import { useAssetFormOptions } from "@/lib/assets/options";
import { useNetworkDeviceTypes, useUplinkAssets } from "@/lib/network-hardware/options";
import type { NetworkDeviceDetail, NetworkDeviceRequest } from "@/lib/network-hardware/types";

export function NetworkHardwareForm({ existing }: { existing?: NetworkDeviceDetail }) {
  const router = useRouter();
  const { statuses, manufacturers, vendors, locations, departments, users } = useAssetFormOptions();
  const deviceTypes = useNetworkDeviceTypes();
  const uplinkAssets = useUplinkAssets(existing?.assetId);

  const [core, setCore] = React.useState({
    assetTypeId: existing?.assetTypeId?.toString() ?? "",
    name: existing?.name ?? "",
    manufacturerId: existing?.manufacturerId?.toString() ?? "",
    model: existing?.model ?? "",
    serialNumber: existing?.serialNumber ?? "",
    fixedAssetNo: existing?.fixedAssetNo ?? "",
    statusId: existing?.statusId?.toString() ?? "",
    notes: existing?.notes ?? "",
  });

  const [net, setNet] = React.useState({
    hostname: existing?.hostname ?? "",
    macAddress: existing?.macAddress ?? "",
    managementIpAddress: existing?.managementIpAddress ?? "",
    portCount: existing?.portCount?.toString() ?? "",
    portSpeed: existing?.portSpeed ?? "",
    poeSupport: existing?.poeSupport ?? false,
  });

  const [stack, setStack] = React.useState({
    stackInfo: existing?.stackInfo ?? "",
    uplinkAssetId: existing?.uplinkAssetId?.toString() ?? "",
  });

  const [loc, setLoc] = React.useState({
    locationId: existing?.locationId?.toString() ?? "",
    departmentId: existing?.departmentId?.toString() ?? "",
    ownerUserId: existing?.ownerUserId?.toString() ?? "",
    vendorId: existing?.vendorId?.toString() ?? "",
    costCenter: existing?.costCenter ?? "",
  });

  const [lifecycle, setLifecycle] = React.useState({
    purchaseDate: existing?.purchaseDate ?? "",
    installDate: existing?.installDate ?? "",
    firmwareVersion: existing?.firmwareVersion ?? "",
    firmwareUpdatedAt: existing?.firmwareUpdatedAt ?? "",
    eolDate: existing?.eolDate ?? "",
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function str(v: string): string | null {
    return v.trim() === "" ? null : v.trim();
  }
  function num(v: string): number | null {
    const n = Number(v);
    return v.trim() === "" || Number.isNaN(n) ? null : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!core.assetTypeId || !core.statusId) {
      setError("กรอกข้อมูลที่จำเป็นให้ครบ (Category/Sub-category, Status)");
      return;
    }
    setSubmitting(true);
    setError(null);

    const body: NetworkDeviceRequest = {
      assetTypeId: Number(core.assetTypeId),
      name: core.name.trim(),
      manufacturerId: core.manufacturerId ? Number(core.manufacturerId) : null,
      model: str(core.model),
      serialNumber: str(core.serialNumber),
      statusId: Number(core.statusId),
      locationId: loc.locationId ? Number(loc.locationId) : null,
      departmentId: loc.departmentId ? Number(loc.departmentId) : null,
      ownerUserId: loc.ownerUserId ? Number(loc.ownerUserId) : null,
      vendorId: loc.vendorId ? Number(loc.vendorId) : null,
      poNumber: null,
      purchaseDate: str(lifecycle.purchaseDate),
      purchasePrice: null,
      currency: "THB",
      receivedDate: null,
      installDate: str(lifecycle.installDate),
      serviceStartDate: null,
      fixedAssetNo: str(core.fixedAssetNo),
      costCenter: str(loc.costCenter),
      notes: str(core.notes),
      eolDate: str(lifecycle.eolDate),
      hostname: str(net.hostname),
      macAddress: str(net.macAddress),
      portCount: net.portCount ? (num(net.portCount) as number | null) : null,
      portSpeed: str(net.portSpeed),
      poeSupport: net.poeSupport,
      firmwareVersion: str(lifecycle.firmwareVersion),
      firmwareUpdatedAt: str(lifecycle.firmwareUpdatedAt),
      stackInfo: str(stack.stackInfo),
      uplinkAssetId: stack.uplinkAssetId ? Number(stack.uplinkAssetId) : null,
      managementIpAddress: str(net.managementIpAddress),
    };

    const res = existing
      ? await apiFetch(`/api/network-devices/${existing.assetId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/network-devices", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/network-hardware/${saved.assetId}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Identity">
        <SelectField id="assetType" label="Category / Sub-category" required
          value={core.assetTypeId} onChange={(v) => setCore((c) => ({ ...c, assetTypeId: v }))}
          options={deviceTypes.map((t) => ({ id: t.id, label: t.fullPath }))} placeholder="— Select —" />
        <TextField id="name" label="Device Name" required value={core.name} onChange={(v) => setCore((c) => ({ ...c, name: v }))} />
        <SelectField id="manufacturer" label="Brand" value={core.manufacturerId} onChange={(v) => setCore((c) => ({ ...c, manufacturerId: v }))} options={manufacturers} />
        <TextField id="model" label="Model" value={core.model} onChange={(v) => setCore((c) => ({ ...c, model: v }))} />
        <TextField id="serial" label="Serial Number" value={core.serialNumber} onChange={(v) => setCore((c) => ({ ...c, serialNumber: v }))} />
        <TextField id="fixedAssetNo" label="Fixed Asset No." value={core.fixedAssetNo} onChange={(v) => setCore((c) => ({ ...c, fixedAssetNo: v }))} />
        <SelectField id="status" label="Status" required value={core.statusId} onChange={(v) => setCore((c) => ({ ...c, statusId: v }))} options={statuses} placeholder="— Select —" />
      </Section>

      <Section title="Network">
        <TextField id="hostname" label="Hostname" value={net.hostname} onChange={(v) => setNet((s) => ({ ...s, hostname: v }))} />
        <TextField id="macAddress" label="MAC Address" value={net.macAddress} onChange={(v) => setNet((s) => ({ ...s, macAddress: v }))} />
        <TextField id="managementIp" label="IP Management" value={net.managementIpAddress} onChange={(v) => setNet((s) => ({ ...s, managementIpAddress: v }))} />
        <TextField id="portCount" label="Port Count" type="number" value={net.portCount} onChange={(v) => setNet((s) => ({ ...s, portCount: v }))} />
        <TextField id="portSpeed" label="Port Speed" value={net.portSpeed} onChange={(v) => setNet((s) => ({ ...s, portSpeed: v }))} />
        <CheckboxField id="poeSupport" label="PoE Support" checked={net.poeSupport} onChange={(v) => setNet((s) => ({ ...s, poeSupport: v }))} />
      </Section>

      <Section title="Stack">
        <TextField id="stackInfo" label="Stack Info" value={stack.stackInfo} onChange={(v) => setStack((s) => ({ ...s, stackInfo: v }))} />
        <SelectField id="uplinkAsset" label="Uplink Device" value={stack.uplinkAssetId} onChange={(v) => setStack((s) => ({ ...s, uplinkAssetId: v }))} options={uplinkAssets} />
      </Section>

      <Section title="Location">
        <SelectField id="location" label="Location" value={loc.locationId} onChange={(v) => setLoc((s) => ({ ...s, locationId: v }))} options={locations} />
        <SelectField id="department" label="Department" value={loc.departmentId} onChange={(v) => setLoc((s) => ({ ...s, departmentId: v }))} options={departments} />
        <SelectField id="owner" label="Owner" value={loc.ownerUserId} onChange={(v) => setLoc((s) => ({ ...s, ownerUserId: v }))} options={users} />
        <SelectField id="vendor" label="Vendor" value={loc.vendorId} onChange={(v) => setLoc((s) => ({ ...s, vendorId: v }))} options={vendors} />
        <TextField id="costCenter" label="Cost Center" value={loc.costCenter} onChange={(v) => setLoc((s) => ({ ...s, costCenter: v }))} />
      </Section>

      <Section title="Lifecycle">
        <TextField id="purchaseDate" label="Purchase Date" type="date" value={lifecycle.purchaseDate} onChange={(v) => setLifecycle((s) => ({ ...s, purchaseDate: v }))} />
        <TextField id="installDate" label="Commission Date" type="date" value={lifecycle.installDate} onChange={(v) => setLifecycle((s) => ({ ...s, installDate: v }))} />
        <TextField id="firmwareVersion" label="Firmware Version" value={lifecycle.firmwareVersion} onChange={(v) => setLifecycle((s) => ({ ...s, firmwareVersion: v }))} />
        <TextField id="firmwareUpdatedAt" label="Firmware Updated" type="date" value={lifecycle.firmwareUpdatedAt} onChange={(v) => setLifecycle((s) => ({ ...s, firmwareUpdatedAt: v }))} />
        <TextField id="eolDate" label="EOL Date" type="date" value={lifecycle.eolDate} onChange={(v) => setLifecycle((s) => ({ ...s, eolDate: v }))} />
        {existing?.warrantyUntil && (
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-text-secondary">Warranty Until</span>
            <p className="text-sm text-text-primary">{existing.warrantyUntil} <span className="text-xs text-text-tertiary">(จาก Contracts)</span></p>
          </div>
        )}
      </Section>

      <Section title="Description">
        <div className="sm:col-span-2 lg:col-span-3">
          <textarea value={core.notes} onChange={(e) => setCore((c) => ({ ...c, notes: e.target.value }))}
            className="h-20 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary" />
        </div>
      </Section>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
