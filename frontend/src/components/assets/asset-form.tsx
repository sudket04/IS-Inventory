"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAssetFormOptions } from "@/lib/assets/options";
import { Section, TextField, SelectField, CheckboxField } from "@/components/assets/form-fields";
import type { AssetDetail } from "@/lib/assets/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

interface CoreFormState {
  name: string;
  manufacturerId: string;
  model: string;
  serialNumber: string;
  statusId: string;
  locationId: string;
  departmentId: string;
  ownerUserId: string;
  vendorId: string;
  poNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  currency: string;
  receivedDate: string;
  installDate: string;
  serviceStartDate: string;
  fixedAssetNo: string;
  serviceTag: string;
  systemUuid: string;
  costCenter: string;
  notes: string;
}

interface ServerFormState {
  hostname: string; macAddress: string; cpuModel: string; cpuSocketCount: string; ramGb: string;
  osName: string; osVersion: string; osInstallDate: string; lastPatchDate: string; parentHostAssetId: string;
}

interface NetworkFormState {
  hostname: string; macAddress: string; portSpeed: string; poeSupport: boolean;
  firmwareVersion: string; firmwareUpdatedAt: string; stackInfo: string; uplinkAssetId: string;
}

const emptyCore: CoreFormState = {
  name: "", manufacturerId: "", model: "", serialNumber: "", statusId: "", locationId: "",
  departmentId: "", ownerUserId: "", vendorId: "", poNumber: "", purchaseDate: "", purchasePrice: "",
  currency: "THB", receivedDate: "", installDate: "", serviceStartDate: "", fixedAssetNo: "",
  serviceTag: "", systemUuid: "", costCenter: "", notes: "",
};

const emptyServer: ServerFormState = {
  hostname: "", macAddress: "", cpuModel: "", cpuSocketCount: "", ramGb: "",
  osName: "", osVersion: "", osInstallDate: "", lastPatchDate: "", parentHostAssetId: "",
};

const emptyNetwork: NetworkFormState = {
  hostname: "", macAddress: "", portSpeed: "", poeSupport: false,
  firmwareVersion: "", firmwareUpdatedAt: "", stackInfo: "", uplinkAssetId: "",
};

function coreFromExisting(a: AssetDetail): CoreFormState {
  const toStr = (v: string | number | null) => (v === null || v === undefined ? "" : String(v));
  return {
    name: a.name,
    manufacturerId: toStr(a.manufacturerId),
    model: a.model ?? "",
    serialNumber: a.serialNumber ?? "",
    statusId: toStr(a.statusId),
    locationId: toStr(a.locationId),
    departmentId: toStr(a.departmentId),
    ownerUserId: toStr(a.ownerUserId),
    vendorId: toStr(a.vendorId),
    poNumber: a.poNumber ?? "",
    purchaseDate: a.purchaseDate ?? "",
    purchasePrice: toStr(a.purchasePrice),
    currency: a.currency,
    receivedDate: a.receivedDate ?? "",
    installDate: a.installDate ?? "",
    serviceStartDate: a.serviceStartDate ?? "",
    fixedAssetNo: a.fixedAssetNo ?? "",
    serviceTag: a.serviceTag ?? "",
    systemUuid: a.systemUuid ?? "",
    costCenter: a.costCenter ?? "",
    notes: a.notes ?? "",
  };
}

export function AssetForm({ existing }: { existing?: AssetDetail }) {
  const router = useRouter();
  const options = useAssetFormOptions();
  const isEdit = Boolean(existing);

  const [categoryId, setCategoryId] = React.useState(existing ? String(existing.categoryId) : "");
  const [core, setCore] = React.useState<CoreFormState>(existing ? coreFromExisting(existing) : emptyCore);
  const [serverDetails, setServerDetails] = React.useState<ServerFormState>(
    existing?.serverDetails
      ? {
          hostname: existing.serverDetails.hostname ?? "",
          macAddress: existing.serverDetails.macAddress ?? "",
          cpuModel: existing.serverDetails.cpuModel ?? "",
          cpuSocketCount: existing.serverDetails.cpuSocketCount?.toString() ?? "",
          ramGb: existing.serverDetails.ramGb?.toString() ?? "",
          osName: existing.serverDetails.osName ?? "",
          osVersion: existing.serverDetails.osVersion ?? "",
          osInstallDate: existing.serverDetails.osInstallDate ?? "",
          lastPatchDate: existing.serverDetails.lastPatchDate ?? "",
          parentHostAssetId: existing.serverDetails.parentHostAssetId?.toString() ?? "",
        }
      : emptyServer
  );
  const [networkDetails, setNetworkDetails] = React.useState<NetworkFormState>(
    existing?.networkDetails
      ? {
          hostname: existing.networkDetails.hostname ?? "",
          macAddress: existing.networkDetails.macAddress ?? "",
          portSpeed: existing.networkDetails.portSpeed ?? "",
          poeSupport: existing.networkDetails.poeSupport ?? false,
          firmwareVersion: existing.networkDetails.firmwareVersion ?? "",
          firmwareUpdatedAt: existing.networkDetails.firmwareUpdatedAt ?? "",
          stackInfo: existing.networkDetails.stackInfo ?? "",
          uplinkAssetId: existing.networkDetails.uplinkAssetId?.toString() ?? "",
        }
      : emptyNetwork
  );

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const categoryCode = options.categories.find((c) => String(c.id) === categoryId)?.label;
  const isServer = isEdit ? existing!.categoryCode === "SRV" : categoryCode === "Server";
  const isNetwork = isEdit ? existing!.categoryCode === "NET" : categoryCode === "Network Device";

  function set<K extends keyof CoreFormState>(key: K, value: string) {
    setCore((c) => ({ ...c, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      ...(isEdit ? {} : { categoryId: Number(categoryId) }),
      name: core.name.trim(),
      manufacturerId: num(core.manufacturerId),
      model: str(core.model),
      serialNumber: str(core.serialNumber),
      statusId: Number(core.statusId),
      locationId: num(core.locationId),
      departmentId: num(core.departmentId),
      ownerUserId: num(core.ownerUserId),
      vendorId: num(core.vendorId),
      poNumber: str(core.poNumber),
      purchaseDate: str(core.purchaseDate),
      purchasePrice: core.purchasePrice.trim() === "" ? null : Number(core.purchasePrice),
      currency: core.currency.trim() || "THB",
      receivedDate: str(core.receivedDate),
      installDate: str(core.installDate),
      serviceStartDate: str(core.serviceStartDate),
      fixedAssetNo: str(core.fixedAssetNo),
      serviceTag: str(core.serviceTag),
      systemUuid: str(core.systemUuid),
      costCenter: str(core.costCenter),
      notes: str(core.notes),
      serverDetails: isServer
        ? {
            hostname: str(serverDetails.hostname),
            macAddress: str(serverDetails.macAddress),
            cpuModel: str(serverDetails.cpuModel),
            cpuSocketCount: num(serverDetails.cpuSocketCount),
            ramGb: num(serverDetails.ramGb),
            osName: str(serverDetails.osName),
            osVersion: str(serverDetails.osVersion),
            osInstallDate: str(serverDetails.osInstallDate),
            lastPatchDate: str(serverDetails.lastPatchDate),
            parentHostAssetId: num(serverDetails.parentHostAssetId),
          }
        : null,
      networkDetails: isNetwork
        ? {
            hostname: str(networkDetails.hostname),
            macAddress: str(networkDetails.macAddress),
            portSpeed: str(networkDetails.portSpeed),
            poeSupport: networkDetails.poeSupport,
            firmwareVersion: str(networkDetails.firmwareVersion),
            firmwareUpdatedAt: str(networkDetails.firmwareUpdatedAt),
            stackInfo: str(networkDetails.stackInfo),
            uplinkAssetId: num(networkDetails.uplinkAssetId),
          }
        : null,
    };

    const res = await apiFetch(isEdit ? `/api/assets/${existing!.assetId}` : "/api/assets", {
      method: isEdit ? "PUT" : "POST",
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      setError(errBody.message ?? "Could not save the asset.");
      return;
    }

    router.push("/assets");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <Section title="Category">
          <SelectField
            id="categoryId"
            label="Asset Category"
            required
            value={categoryId}
            onChange={setCategoryId}
            options={options.categories.filter((c) => c.label === "Server" || c.label === "Network Device")}
            placeholder="Select a category…"
          />
        </Section>
      )}

      {isEdit && (
        <p className="text-sm text-text-secondary">
          {existing!.assetTag} · {existing!.categoryName}
        </p>
      )}

      <Section title="Basic Information">
        <TextField id="name" label="Name" required value={core.name} onChange={(v) => set("name", v)} />
        <SelectField id="manufacturerId" label="Manufacturer" value={core.manufacturerId} onChange={(v) => set("manufacturerId", v)} options={options.manufacturers} />
        <TextField id="model" label="Model" value={core.model} onChange={(v) => set("model", v)} />
        <TextField id="serialNumber" label="Serial Number" value={core.serialNumber} onChange={(v) => set("serialNumber", v)} />
        <SelectField id="statusId" label="Status" required value={core.statusId} onChange={(v) => set("statusId", v)} options={options.statuses} placeholder="Select a status…" />
      </Section>

      <Section title="Ownership & Location">
        <SelectField id="locationId" label="Location" value={core.locationId} onChange={(v) => set("locationId", v)} options={options.locations} />
        <SelectField id="departmentId" label="Department" value={core.departmentId} onChange={(v) => set("departmentId", v)} options={options.departments} />
        <SelectField id="ownerUserId" label="Owner" value={core.ownerUserId} onChange={(v) => set("ownerUserId", v)} options={options.users} />
      </Section>

      <Section title="Purchase">
        <SelectField id="vendorId" label="Vendor" value={core.vendorId} onChange={(v) => set("vendorId", v)} options={options.vendors} />
        <TextField id="poNumber" label="PO Number" value={core.poNumber} onChange={(v) => set("poNumber", v)} />
        <TextField id="purchaseDate" label="Purchase Date" type="date" value={core.purchaseDate} onChange={(v) => set("purchaseDate", v)} />
        <TextField id="purchasePrice" label="Purchase Price" type="number" value={core.purchasePrice} onChange={(v) => set("purchasePrice", v)} />
        <TextField id="currency" label="Currency" value={core.currency} onChange={(v) => set("currency", v)} />
      </Section>

      <Section title="Lifecycle">
        <TextField id="receivedDate" label="Received Date" type="date" value={core.receivedDate} onChange={(v) => set("receivedDate", v)} />
        <TextField id="installDate" label="Install Date" type="date" value={core.installDate} onChange={(v) => set("installDate", v)} />
        <TextField id="serviceStartDate" label="Service Start Date" type="date" value={core.serviceStartDate} onChange={(v) => set("serviceStartDate", v)} />
      </Section>

      <Section title="Identifiers">
        <TextField id="fixedAssetNo" label="Fixed Asset No." value={core.fixedAssetNo} onChange={(v) => set("fixedAssetNo", v)} />
        <TextField id="serviceTag" label="Service Tag" value={core.serviceTag} onChange={(v) => set("serviceTag", v)} />
        <TextField id="systemUuid" label="System UUID" value={core.systemUuid} onChange={(v) => set("systemUuid", v)} />
        <TextField id="costCenter" label="Cost Center" value={core.costCenter} onChange={(v) => set("costCenter", v)} />
      </Section>

      {isServer && (
        <Section title="Server Details">
          <TextField id="sd-hostname" label="Hostname" value={serverDetails.hostname} onChange={(v) => setServerDetails((s) => ({ ...s, hostname: v }))} />
          <TextField id="sd-mac" label="MAC Address" value={serverDetails.macAddress} onChange={(v) => setServerDetails((s) => ({ ...s, macAddress: v }))} />
          <TextField id="sd-cpu" label="CPU Model" value={serverDetails.cpuModel} onChange={(v) => setServerDetails((s) => ({ ...s, cpuModel: v }))} />
          <TextField id="sd-sockets" label="CPU Sockets" type="number" value={serverDetails.cpuSocketCount} onChange={(v) => setServerDetails((s) => ({ ...s, cpuSocketCount: v }))} />
          <TextField id="sd-ram" label="RAM (GB)" type="number" value={serverDetails.ramGb} onChange={(v) => setServerDetails((s) => ({ ...s, ramGb: v }))} />
          <TextField id="sd-os-name" label="OS Name" value={serverDetails.osName} onChange={(v) => setServerDetails((s) => ({ ...s, osName: v }))} />
          <TextField id="sd-os-version" label="OS Version" value={serverDetails.osVersion} onChange={(v) => setServerDetails((s) => ({ ...s, osVersion: v }))} />
          <TextField id="sd-os-install" label="OS Install Date" type="date" value={serverDetails.osInstallDate} onChange={(v) => setServerDetails((s) => ({ ...s, osInstallDate: v }))} />
          <TextField id="sd-last-patch" label="Last Patch Date" type="date" value={serverDetails.lastPatchDate} onChange={(v) => setServerDetails((s) => ({ ...s, lastPatchDate: v }))} />
          <TextField id="sd-parent-host" label="Parent Host Asset ID" type="number" value={serverDetails.parentHostAssetId} onChange={(v) => setServerDetails((s) => ({ ...s, parentHostAssetId: v }))} />
        </Section>
      )}

      {isNetwork && (
        <Section title="Network Device Details">
          <TextField id="nd-hostname" label="Hostname" value={networkDetails.hostname} onChange={(v) => setNetworkDetails((s) => ({ ...s, hostname: v }))} />
          <TextField id="nd-mac" label="MAC Address" value={networkDetails.macAddress} onChange={(v) => setNetworkDetails((s) => ({ ...s, macAddress: v }))} />
          <TextField id="nd-port-speed" label="Port Speed" value={networkDetails.portSpeed} onChange={(v) => setNetworkDetails((s) => ({ ...s, portSpeed: v }))} />
          <CheckboxField id="nd-poe" label="PoE Support" checked={networkDetails.poeSupport} onChange={(v) => setNetworkDetails((s) => ({ ...s, poeSupport: v }))} />
          <TextField id="nd-firmware" label="Firmware Version" value={networkDetails.firmwareVersion} onChange={(v) => setNetworkDetails((s) => ({ ...s, firmwareVersion: v }))} />
          <TextField id="nd-firmware-date" label="Firmware Updated" type="date" value={networkDetails.firmwareUpdatedAt} onChange={(v) => setNetworkDetails((s) => ({ ...s, firmwareUpdatedAt: v }))} />
          <TextField id="nd-stack" label="Stack Info" value={networkDetails.stackInfo} onChange={(v) => setNetworkDetails((s) => ({ ...s, stackInfo: v }))} />
          <TextField id="nd-uplink" label="Uplink Asset ID" type="number" value={networkDetails.uplinkAssetId} onChange={(v) => setNetworkDetails((s) => ({ ...s, uplinkAssetId: v }))} />
        </Section>
      )}

      <Section title="Notes">
        <div className="col-span-full space-y-1.5">
          <NotesField value={core.notes} onChange={(v) => set("notes", v)} />
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/assets")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || (!isEdit && !categoryId)}>
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Asset"}
        </Button>
      </div>
    </form>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      aria-label="Notes"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-24 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
    />
  );
}
