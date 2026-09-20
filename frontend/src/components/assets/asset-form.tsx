"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAssetFormOptions } from "@/lib/assets/options";
import { Section, TextField, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import type {
  AssetDetail,
  ServerDetailsForm,
  NetworkDetailsForm,
  ComputerDetailsForm,
  StorageDetailsForm,
  PowerDetailsForm,
  PeripheralDetailsForm,
  MobileIotDetailsForm,
} from "@/lib/assets/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

// These mirror CHECK constraints in docs/database/11-module-v1.3b-details-rack-ipam.sql —
// values outside these lists are rejected by the database, not just validated client-side.
const CONNECTION_TYPES = ["USB", "NETWORK", "HDMI", "BLUETOOTH", "WIRELESS", "SERIAL", "PARALLEL", "DISPLAYPORT"];
const PRINT_TECHNOLOGIES = ["LASER", "INKJET", "THERMAL", "DOT_MATRIX", "LED", "RESIN", "FDM"];
const PANEL_TYPES = ["IPS", "VA", "TN", "OLED", "LED"];
const MOUNT_TYPES = ["DESK", "VESA", "WALL", "CEILING", "FLOOR"];
const MAX_PAPER_SIZES = ["A4", "A3", "A2", "A1", "A0", "LETTER", "LEGAL"];
const DEVICE_PROTOCOLS = ["MODBUS", "OPC_UA", "BACNET", "MQTT", "PROFINET", "ETHERNET_IP", "SNMP", "ONVIF", "OTHER"];
const IOT_STORAGE_TYPES = ["SD_CARD", "NVR", "CLOUD", "NAS", "NONE"];

const SUPPORTED_CATEGORY_LABELS = [
  "Server",
  "Network Device",
  "Computer",
  "Storage",
  "Power & Cooling",
  "Peripheral",
  "Mobile & IoT/OT",
];

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

const emptyCore: CoreFormState = {
  name: "", manufacturerId: "", model: "", serialNumber: "", statusId: "", locationId: "",
  departmentId: "", ownerUserId: "", vendorId: "", poNumber: "", purchaseDate: "", purchasePrice: "",
  currency: "THB", receivedDate: "", installDate: "", serviceStartDate: "", fixedAssetNo: "",
  serviceTag: "", systemUuid: "", costCenter: "", notes: "",
};

const emptyServer: ServerDetailsForm = {
  hostname: "", macAddress: "", cpuModel: "", cpuSocketCount: "", ramGb: "",
  osName: "", osVersion: "", osInstallDate: "", lastPatchDate: "", parentHostAssetId: "",
};

const emptyNetwork: NetworkDetailsForm = {
  hostname: "", macAddress: "", portSpeed: "", poeSupport: false,
  firmwareVersion: "", firmwareUpdatedAt: "", stackInfo: "", uplinkAssetId: "",
};

const emptyComputer: ComputerDetailsForm = {
  hostname: "", macAddress: "", cpuModel: "", ramGb: "", storageConfig: "",
  osName: "", osVersion: "", assignedDate: "", assignedToName: "", domainJoined: false,
};

const emptyStorage: StorageDetailsForm = {
  hostname: "", mgmtUrl: "", controllerCount: "", diskBayTotal: "", diskBayUsed: "",
  rawCapacityTb: "", usableCapacityTb: "", cacheGb: "", supportedProtocols: "",
  expansionShelfCount: "", firmwareVersion: "", firmwareUpdatedAt: "",
  hasDedup: false, hasCompression: false, hasSnapshot: false, hasReplication: false,
};

const emptyPower: PowerDetailsForm = {
  capacityKva: "", capacityKw: "", inputPhase: "", inputVoltage: "", outputVoltage: "",
  outletCount: "", outletType: "", batteryCount: "", batteryModel: "",
  batteryInstallDate: "", batteryReplaceDue: "", runtimeMinutesFullLoad: "",
  currentLoadPercent: "", loadMeasuredAt: "", hasBypass: false, hasSnmpCard: false,
  firmwareVersion: "", coolingCapacityBtu: "", refrigerantType: "", lastServiceDate: "",
};

const emptyPeripheral: PeripheralDetailsForm = {
  connectionType: "", firmwareVersion: "", printTechnology: "", isColor: false, maxPaperSize: "",
  hasDuplex: false, hasAdf: false, pageCounterMono: "", pageCounterColor: "", counterReadDate: "",
  tonerModel: "", screenSizeInch: "", resolution: "", panelType: "", refreshRateHz: "",
  hasSpeaker: false, mountType: "",
};

const emptyMobileIot: MobileIotDetailsForm = {
  imei: "", phoneNumber: "", simProvider: "", osName: "", osVersion: "",
  isMdmEnrolled: false, mdmPlatform: "", hostname: "", macAddress: "", firmwareVersion: "",
  deviceProtocol: "", controllerModel: "", ioPointCount: "", resolution: "",
  hasPtz: false, hasIr: false, storageType: "", assignedToName: "", assignedDate: "",
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

  const [serverDetails, setServerDetails] = React.useState<ServerDetailsForm>(
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
  const [networkDetails, setNetworkDetails] = React.useState<NetworkDetailsForm>(
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
  const [computerDetails, setComputerDetails] = React.useState<ComputerDetailsForm>(
    existing?.computerDetails
      ? {
          hostname: existing.computerDetails.hostname ?? "",
          macAddress: existing.computerDetails.macAddress ?? "",
          cpuModel: existing.computerDetails.cpuModel ?? "",
          ramGb: existing.computerDetails.ramGb?.toString() ?? "",
          storageConfig: existing.computerDetails.storageConfig ?? "",
          osName: existing.computerDetails.osName ?? "",
          osVersion: existing.computerDetails.osVersion ?? "",
          assignedDate: existing.computerDetails.assignedDate ?? "",
          assignedToName: existing.computerDetails.assignedToName ?? "",
          domainJoined: existing.computerDetails.domainJoined ?? false,
        }
      : emptyComputer
  );
  const [storageDetails, setStorageDetails] = React.useState<StorageDetailsForm>(
    existing?.storageDetails
      ? {
          hostname: existing.storageDetails.hostname ?? "",
          mgmtUrl: existing.storageDetails.mgmtUrl ?? "",
          controllerCount: existing.storageDetails.controllerCount?.toString() ?? "",
          diskBayTotal: existing.storageDetails.diskBayTotal?.toString() ?? "",
          diskBayUsed: existing.storageDetails.diskBayUsed?.toString() ?? "",
          rawCapacityTb: existing.storageDetails.rawCapacityTb?.toString() ?? "",
          usableCapacityTb: existing.storageDetails.usableCapacityTb?.toString() ?? "",
          cacheGb: existing.storageDetails.cacheGb?.toString() ?? "",
          supportedProtocols: existing.storageDetails.supportedProtocols ?? "",
          expansionShelfCount: existing.storageDetails.expansionShelfCount?.toString() ?? "",
          firmwareVersion: existing.storageDetails.firmwareVersion ?? "",
          firmwareUpdatedAt: existing.storageDetails.firmwareUpdatedAt ?? "",
          hasDedup: existing.storageDetails.hasDedup ?? false,
          hasCompression: existing.storageDetails.hasCompression ?? false,
          hasSnapshot: existing.storageDetails.hasSnapshot ?? false,
          hasReplication: existing.storageDetails.hasReplication ?? false,
        }
      : emptyStorage
  );
  const [powerDetails, setPowerDetails] = React.useState<PowerDetailsForm>(
    existing?.powerDetails
      ? {
          capacityKva: existing.powerDetails.capacityKva?.toString() ?? "",
          capacityKw: existing.powerDetails.capacityKw?.toString() ?? "",
          inputPhase: existing.powerDetails.inputPhase?.toString() ?? "",
          inputVoltage: existing.powerDetails.inputVoltage ?? "",
          outputVoltage: existing.powerDetails.outputVoltage ?? "",
          outletCount: existing.powerDetails.outletCount?.toString() ?? "",
          outletType: existing.powerDetails.outletType ?? "",
          batteryCount: existing.powerDetails.batteryCount?.toString() ?? "",
          batteryModel: existing.powerDetails.batteryModel ?? "",
          batteryInstallDate: existing.powerDetails.batteryInstallDate ?? "",
          batteryReplaceDue: existing.powerDetails.batteryReplaceDue ?? "",
          runtimeMinutesFullLoad: existing.powerDetails.runtimeMinutesFullLoad?.toString() ?? "",
          currentLoadPercent: existing.powerDetails.currentLoadPercent?.toString() ?? "",
          loadMeasuredAt: existing.powerDetails.loadMeasuredAt ?? "",
          hasBypass: existing.powerDetails.hasBypass ?? false,
          hasSnmpCard: existing.powerDetails.hasSnmpCard ?? false,
          firmwareVersion: existing.powerDetails.firmwareVersion ?? "",
          coolingCapacityBtu: existing.powerDetails.coolingCapacityBtu?.toString() ?? "",
          refrigerantType: existing.powerDetails.refrigerantType ?? "",
          lastServiceDate: existing.powerDetails.lastServiceDate ?? "",
        }
      : emptyPower
  );
  const [peripheralDetails, setPeripheralDetails] = React.useState<PeripheralDetailsForm>(
    existing?.peripheralDetails
      ? {
          connectionType: existing.peripheralDetails.connectionType ?? "",
          firmwareVersion: existing.peripheralDetails.firmwareVersion ?? "",
          printTechnology: existing.peripheralDetails.printTechnology ?? "",
          isColor: existing.peripheralDetails.isColor ?? false,
          maxPaperSize: existing.peripheralDetails.maxPaperSize ?? "",
          hasDuplex: existing.peripheralDetails.hasDuplex ?? false,
          hasAdf: existing.peripheralDetails.hasAdf ?? false,
          pageCounterMono: existing.peripheralDetails.pageCounterMono?.toString() ?? "",
          pageCounterColor: existing.peripheralDetails.pageCounterColor?.toString() ?? "",
          counterReadDate: existing.peripheralDetails.counterReadDate ?? "",
          tonerModel: existing.peripheralDetails.tonerModel ?? "",
          screenSizeInch: existing.peripheralDetails.screenSizeInch?.toString() ?? "",
          resolution: existing.peripheralDetails.resolution ?? "",
          panelType: existing.peripheralDetails.panelType ?? "",
          refreshRateHz: existing.peripheralDetails.refreshRateHz?.toString() ?? "",
          hasSpeaker: existing.peripheralDetails.hasSpeaker ?? false,
          mountType: existing.peripheralDetails.mountType ?? "",
        }
      : emptyPeripheral
  );
  const [mobileIotDetails, setMobileIotDetails] = React.useState<MobileIotDetailsForm>(
    existing?.mobileIotDetails
      ? {
          imei: existing.mobileIotDetails.imei ?? "",
          phoneNumber: existing.mobileIotDetails.phoneNumber ?? "",
          simProvider: existing.mobileIotDetails.simProvider ?? "",
          osName: existing.mobileIotDetails.osName ?? "",
          osVersion: existing.mobileIotDetails.osVersion ?? "",
          isMdmEnrolled: existing.mobileIotDetails.isMdmEnrolled ?? false,
          mdmPlatform: existing.mobileIotDetails.mdmPlatform ?? "",
          hostname: existing.mobileIotDetails.hostname ?? "",
          macAddress: existing.mobileIotDetails.macAddress ?? "",
          firmwareVersion: existing.mobileIotDetails.firmwareVersion ?? "",
          deviceProtocol: existing.mobileIotDetails.deviceProtocol ?? "",
          controllerModel: existing.mobileIotDetails.controllerModel ?? "",
          ioPointCount: existing.mobileIotDetails.ioPointCount?.toString() ?? "",
          resolution: existing.mobileIotDetails.resolution ?? "",
          hasPtz: existing.mobileIotDetails.hasPtz ?? false,
          hasIr: existing.mobileIotDetails.hasIr ?? false,
          storageType: existing.mobileIotDetails.storageType ?? "",
          assignedToName: existing.mobileIotDetails.assignedToName ?? "",
          assignedDate: existing.mobileIotDetails.assignedDate ?? "",
        }
      : emptyMobileIot
  );

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const categoryCode = options.categories.find((c) => String(c.id) === categoryId)?.label;
  const activeCode = isEdit ? existing!.categoryCode : undefined;
  const activeLabel = isEdit ? existing!.categoryName : categoryCode;

  const isServer = isEdit ? activeCode === "SRV" : activeLabel === "Server";
  const isNetwork = isEdit ? activeCode === "NET" : activeLabel === "Network Device";
  const isComputer = isEdit ? activeCode === "PC" : activeLabel === "Computer";
  const isStorage = isEdit ? activeCode === "STG" : activeLabel === "Storage";
  const isPower = isEdit ? activeCode === "PWR" : activeLabel === "Power & Cooling";
  const isPeripheral = isEdit ? activeCode === "PER" : activeLabel === "Peripheral";
  const isMobileIot = isEdit ? activeCode === "IOT" : activeLabel === "Mobile & IoT/OT";

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
      computerDetails: isComputer
        ? {
            hostname: str(computerDetails.hostname),
            macAddress: str(computerDetails.macAddress),
            cpuModel: str(computerDetails.cpuModel),
            ramGb: num(computerDetails.ramGb),
            storageConfig: str(computerDetails.storageConfig),
            osName: str(computerDetails.osName),
            osVersion: str(computerDetails.osVersion),
            assignedDate: str(computerDetails.assignedDate),
            assignedToName: str(computerDetails.assignedToName),
            domainJoined: computerDetails.domainJoined,
          }
        : null,
      storageDetails: isStorage
        ? {
            hostname: str(storageDetails.hostname),
            mgmtUrl: str(storageDetails.mgmtUrl),
            controllerCount: num(storageDetails.controllerCount),
            diskBayTotal: num(storageDetails.diskBayTotal),
            diskBayUsed: num(storageDetails.diskBayUsed),
            rawCapacityTb: num(storageDetails.rawCapacityTb),
            usableCapacityTb: num(storageDetails.usableCapacityTb),
            cacheGb: num(storageDetails.cacheGb),
            supportedProtocols: str(storageDetails.supportedProtocols),
            expansionShelfCount: num(storageDetails.expansionShelfCount),
            firmwareVersion: str(storageDetails.firmwareVersion),
            firmwareUpdatedAt: str(storageDetails.firmwareUpdatedAt),
            hasDedup: storageDetails.hasDedup,
            hasCompression: storageDetails.hasCompression,
            hasSnapshot: storageDetails.hasSnapshot,
            hasReplication: storageDetails.hasReplication,
          }
        : null,
      powerDetails: isPower
        ? {
            capacityKva: num(powerDetails.capacityKva),
            capacityKw: num(powerDetails.capacityKw),
            inputPhase: num(powerDetails.inputPhase),
            inputVoltage: str(powerDetails.inputVoltage),
            outputVoltage: str(powerDetails.outputVoltage),
            outletCount: num(powerDetails.outletCount),
            outletType: str(powerDetails.outletType),
            batteryCount: num(powerDetails.batteryCount),
            batteryModel: str(powerDetails.batteryModel),
            batteryInstallDate: str(powerDetails.batteryInstallDate),
            batteryReplaceDue: str(powerDetails.batteryReplaceDue),
            runtimeMinutesFullLoad: num(powerDetails.runtimeMinutesFullLoad),
            currentLoadPercent: num(powerDetails.currentLoadPercent),
            loadMeasuredAt: str(powerDetails.loadMeasuredAt),
            hasBypass: powerDetails.hasBypass,
            hasSnmpCard: powerDetails.hasSnmpCard,
            firmwareVersion: str(powerDetails.firmwareVersion),
            coolingCapacityBtu: num(powerDetails.coolingCapacityBtu),
            refrigerantType: str(powerDetails.refrigerantType),
            lastServiceDate: str(powerDetails.lastServiceDate),
          }
        : null,
      peripheralDetails: isPeripheral
        ? {
            connectionType: str(peripheralDetails.connectionType),
            firmwareVersion: str(peripheralDetails.firmwareVersion),
            printTechnology: str(peripheralDetails.printTechnology),
            isColor: peripheralDetails.isColor,
            maxPaperSize: str(peripheralDetails.maxPaperSize),
            hasDuplex: peripheralDetails.hasDuplex,
            hasAdf: peripheralDetails.hasAdf,
            pageCounterMono: num(peripheralDetails.pageCounterMono),
            pageCounterColor: num(peripheralDetails.pageCounterColor),
            counterReadDate: str(peripheralDetails.counterReadDate),
            tonerModel: str(peripheralDetails.tonerModel),
            screenSizeInch: num(peripheralDetails.screenSizeInch),
            resolution: str(peripheralDetails.resolution),
            panelType: str(peripheralDetails.panelType),
            refreshRateHz: num(peripheralDetails.refreshRateHz),
            hasSpeaker: peripheralDetails.hasSpeaker,
            mountType: str(peripheralDetails.mountType),
          }
        : null,
      mobileIotDetails: isMobileIot
        ? {
            imei: str(mobileIotDetails.imei),
            phoneNumber: str(mobileIotDetails.phoneNumber),
            simProvider: str(mobileIotDetails.simProvider),
            osName: str(mobileIotDetails.osName),
            osVersion: str(mobileIotDetails.osVersion),
            isMdmEnrolled: mobileIotDetails.isMdmEnrolled,
            mdmPlatform: str(mobileIotDetails.mdmPlatform),
            hostname: str(mobileIotDetails.hostname),
            macAddress: str(mobileIotDetails.macAddress),
            firmwareVersion: str(mobileIotDetails.firmwareVersion),
            deviceProtocol: str(mobileIotDetails.deviceProtocol),
            controllerModel: str(mobileIotDetails.controllerModel),
            ioPointCount: num(mobileIotDetails.ioPointCount),
            resolution: str(mobileIotDetails.resolution),
            hasPtz: mobileIotDetails.hasPtz,
            hasIr: mobileIotDetails.hasIr,
            storageType: str(mobileIotDetails.storageType),
            assignedToName: str(mobileIotDetails.assignedToName),
            assignedDate: str(mobileIotDetails.assignedDate),
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
            options={options.categories.filter((c) => SUPPORTED_CATEGORY_LABELS.includes(c.label))}
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

      {isComputer && (
        <Section title="Computer Details">
          <TextField id="cd-hostname" label="Hostname" value={computerDetails.hostname} onChange={(v) => setComputerDetails((s) => ({ ...s, hostname: v }))} />
          <TextField id="cd-mac" label="MAC Address" value={computerDetails.macAddress} onChange={(v) => setComputerDetails((s) => ({ ...s, macAddress: v }))} />
          <TextField id="cd-cpu" label="CPU Model" value={computerDetails.cpuModel} onChange={(v) => setComputerDetails((s) => ({ ...s, cpuModel: v }))} />
          <TextField id="cd-ram" label="RAM (GB)" type="number" value={computerDetails.ramGb} onChange={(v) => setComputerDetails((s) => ({ ...s, ramGb: v }))} />
          <TextField id="cd-storage" label="Storage Config" value={computerDetails.storageConfig} onChange={(v) => setComputerDetails((s) => ({ ...s, storageConfig: v }))} />
          <TextField id="cd-os-name" label="OS Name" value={computerDetails.osName} onChange={(v) => setComputerDetails((s) => ({ ...s, osName: v }))} />
          <TextField id="cd-os-version" label="OS Version" value={computerDetails.osVersion} onChange={(v) => setComputerDetails((s) => ({ ...s, osVersion: v }))} />
          <TextField id="cd-assigned-date" label="Assigned Date" type="date" value={computerDetails.assignedDate} onChange={(v) => setComputerDetails((s) => ({ ...s, assignedDate: v }))} />
          <TextField id="cd-assigned-to" label="Assigned To" value={computerDetails.assignedToName} onChange={(v) => setComputerDetails((s) => ({ ...s, assignedToName: v }))} />
          <CheckboxField id="cd-domain" label="Domain Joined" checked={computerDetails.domainJoined} onChange={(v) => setComputerDetails((s) => ({ ...s, domainJoined: v }))} />
        </Section>
      )}

      {isStorage && (
        <Section title="Storage Details">
          <TextField id="gd-hostname" label="Hostname" value={storageDetails.hostname} onChange={(v) => setStorageDetails((s) => ({ ...s, hostname: v }))} />
          <TextField id="gd-mgmt-url" label="Management URL" value={storageDetails.mgmtUrl} onChange={(v) => setStorageDetails((s) => ({ ...s, mgmtUrl: v }))} />
          <TextField id="gd-controllers" label="Controller Count" type="number" value={storageDetails.controllerCount} onChange={(v) => setStorageDetails((s) => ({ ...s, controllerCount: v }))} />
          <TextField id="gd-bay-total" label="Disk Bay Total" type="number" value={storageDetails.diskBayTotal} onChange={(v) => setStorageDetails((s) => ({ ...s, diskBayTotal: v }))} />
          <TextField id="gd-bay-used" label="Disk Bay Used" type="number" value={storageDetails.diskBayUsed} onChange={(v) => setStorageDetails((s) => ({ ...s, diskBayUsed: v }))} />
          <TextField id="gd-raw-capacity" label="Raw Capacity (TB)" type="number" value={storageDetails.rawCapacityTb} onChange={(v) => setStorageDetails((s) => ({ ...s, rawCapacityTb: v }))} />
          <TextField id="gd-usable-capacity" label="Usable Capacity (TB)" type="number" value={storageDetails.usableCapacityTb} onChange={(v) => setStorageDetails((s) => ({ ...s, usableCapacityTb: v }))} />
          <TextField id="gd-cache" label="Cache (GB)" type="number" value={storageDetails.cacheGb} onChange={(v) => setStorageDetails((s) => ({ ...s, cacheGb: v }))} />
          <TextField id="gd-protocols" label="Supported Protocols" value={storageDetails.supportedProtocols} onChange={(v) => setStorageDetails((s) => ({ ...s, supportedProtocols: v }))} />
          <TextField id="gd-shelves" label="Expansion Shelf Count" type="number" value={storageDetails.expansionShelfCount} onChange={(v) => setStorageDetails((s) => ({ ...s, expansionShelfCount: v }))} />
          <TextField id="gd-firmware" label="Firmware Version" value={storageDetails.firmwareVersion} onChange={(v) => setStorageDetails((s) => ({ ...s, firmwareVersion: v }))} />
          <TextField id="gd-firmware-date" label="Firmware Updated" type="date" value={storageDetails.firmwareUpdatedAt} onChange={(v) => setStorageDetails((s) => ({ ...s, firmwareUpdatedAt: v }))} />
          <CheckboxField id="gd-dedup" label="Deduplication" checked={storageDetails.hasDedup} onChange={(v) => setStorageDetails((s) => ({ ...s, hasDedup: v }))} />
          <CheckboxField id="gd-compression" label="Compression" checked={storageDetails.hasCompression} onChange={(v) => setStorageDetails((s) => ({ ...s, hasCompression: v }))} />
          <CheckboxField id="gd-snapshot" label="Snapshot" checked={storageDetails.hasSnapshot} onChange={(v) => setStorageDetails((s) => ({ ...s, hasSnapshot: v }))} />
          <CheckboxField id="gd-replication" label="Replication" checked={storageDetails.hasReplication} onChange={(v) => setStorageDetails((s) => ({ ...s, hasReplication: v }))} />
        </Section>
      )}

      {isPower && (
        <Section title="Power & Cooling Details">
          <TextField id="pd-kva" label="Capacity (kVA)" type="number" value={powerDetails.capacityKva} onChange={(v) => setPowerDetails((s) => ({ ...s, capacityKva: v }))} />
          <TextField id="pd-kw" label="Capacity (kW)" type="number" value={powerDetails.capacityKw} onChange={(v) => setPowerDetails((s) => ({ ...s, capacityKw: v }))} />
          <TextField id="pd-input-phase" label="Input Phase" type="number" value={powerDetails.inputPhase} onChange={(v) => setPowerDetails((s) => ({ ...s, inputPhase: v }))} />
          <TextField id="pd-input-voltage" label="Input Voltage" value={powerDetails.inputVoltage} onChange={(v) => setPowerDetails((s) => ({ ...s, inputVoltage: v }))} />
          <TextField id="pd-output-voltage" label="Output Voltage" value={powerDetails.outputVoltage} onChange={(v) => setPowerDetails((s) => ({ ...s, outputVoltage: v }))} />
          <TextField id="pd-outlet-count" label="Outlet Count" type="number" value={powerDetails.outletCount} onChange={(v) => setPowerDetails((s) => ({ ...s, outletCount: v }))} />
          <TextField id="pd-outlet-type" label="Outlet Type" value={powerDetails.outletType} onChange={(v) => setPowerDetails((s) => ({ ...s, outletType: v }))} />
          <TextField id="pd-battery-count" label="Battery Count" type="number" value={powerDetails.batteryCount} onChange={(v) => setPowerDetails((s) => ({ ...s, batteryCount: v }))} />
          <TextField id="pd-battery-model" label="Battery Model" value={powerDetails.batteryModel} onChange={(v) => setPowerDetails((s) => ({ ...s, batteryModel: v }))} />
          <TextField id="pd-battery-install" label="Battery Install Date" type="date" value={powerDetails.batteryInstallDate} onChange={(v) => setPowerDetails((s) => ({ ...s, batteryInstallDate: v }))} />
          <TextField id="pd-battery-replace" label="Battery Replace Due" type="date" value={powerDetails.batteryReplaceDue} onChange={(v) => setPowerDetails((s) => ({ ...s, batteryReplaceDue: v }))} />
          <TextField id="pd-runtime" label="Runtime at Full Load (min)" type="number" value={powerDetails.runtimeMinutesFullLoad} onChange={(v) => setPowerDetails((s) => ({ ...s, runtimeMinutesFullLoad: v }))} />
          <TextField id="pd-load-percent" label="Current Load (%)" type="number" value={powerDetails.currentLoadPercent} onChange={(v) => setPowerDetails((s) => ({ ...s, currentLoadPercent: v }))} />
          <TextField id="pd-load-measured" label="Load Measured At" type="date" value={powerDetails.loadMeasuredAt} onChange={(v) => setPowerDetails((s) => ({ ...s, loadMeasuredAt: v }))} />
          <CheckboxField id="pd-bypass" label="Has Bypass" checked={powerDetails.hasBypass} onChange={(v) => setPowerDetails((s) => ({ ...s, hasBypass: v }))} />
          <CheckboxField id="pd-snmp" label="Has SNMP Card" checked={powerDetails.hasSnmpCard} onChange={(v) => setPowerDetails((s) => ({ ...s, hasSnmpCard: v }))} />
          <TextField id="pd-firmware" label="Firmware Version" value={powerDetails.firmwareVersion} onChange={(v) => setPowerDetails((s) => ({ ...s, firmwareVersion: v }))} />
          <TextField id="pd-cooling-btu" label="Cooling Capacity (BTU)" type="number" value={powerDetails.coolingCapacityBtu} onChange={(v) => setPowerDetails((s) => ({ ...s, coolingCapacityBtu: v }))} />
          <TextField id="pd-refrigerant" label="Refrigerant Type" value={powerDetails.refrigerantType} onChange={(v) => setPowerDetails((s) => ({ ...s, refrigerantType: v }))} />
          <TextField id="pd-last-service" label="Last Service Date" type="date" value={powerDetails.lastServiceDate} onChange={(v) => setPowerDetails((s) => ({ ...s, lastServiceDate: v }))} />
        </Section>
      )}

      {isPeripheral && (
        <Section title="Peripheral Details">
          <EnumSelectField id="rd-connection" label="Connection Type" value={peripheralDetails.connectionType} onChange={(v) => setPeripheralDetails((s) => ({ ...s, connectionType: v }))} options={CONNECTION_TYPES} />
          <TextField id="rd-firmware" label="Firmware Version" value={peripheralDetails.firmwareVersion} onChange={(v) => setPeripheralDetails((s) => ({ ...s, firmwareVersion: v }))} />
          <EnumSelectField id="rd-print-tech" label="Print Technology" value={peripheralDetails.printTechnology} onChange={(v) => setPeripheralDetails((s) => ({ ...s, printTechnology: v }))} options={PRINT_TECHNOLOGIES} />
          <CheckboxField id="rd-color" label="Color" checked={peripheralDetails.isColor} onChange={(v) => setPeripheralDetails((s) => ({ ...s, isColor: v }))} />
          <EnumSelectField id="rd-max-paper" label="Max Paper Size" value={peripheralDetails.maxPaperSize} onChange={(v) => setPeripheralDetails((s) => ({ ...s, maxPaperSize: v }))} options={MAX_PAPER_SIZES} />
          <CheckboxField id="rd-duplex" label="Duplex" checked={peripheralDetails.hasDuplex} onChange={(v) => setPeripheralDetails((s) => ({ ...s, hasDuplex: v }))} />
          <CheckboxField id="rd-adf" label="ADF" checked={peripheralDetails.hasAdf} onChange={(v) => setPeripheralDetails((s) => ({ ...s, hasAdf: v }))} />
          <TextField id="rd-counter-mono" label="Page Counter (Mono)" type="number" value={peripheralDetails.pageCounterMono} onChange={(v) => setPeripheralDetails((s) => ({ ...s, pageCounterMono: v }))} />
          <TextField id="rd-counter-color" label="Page Counter (Color)" type="number" value={peripheralDetails.pageCounterColor} onChange={(v) => setPeripheralDetails((s) => ({ ...s, pageCounterColor: v }))} />
          <TextField id="rd-counter-date" label="Counter Read Date" type="date" value={peripheralDetails.counterReadDate} onChange={(v) => setPeripheralDetails((s) => ({ ...s, counterReadDate: v }))} />
          <TextField id="rd-toner" label="Toner Model" value={peripheralDetails.tonerModel} onChange={(v) => setPeripheralDetails((s) => ({ ...s, tonerModel: v }))} />
          <TextField id="rd-screen-size" label="Screen Size (in.)" type="number" value={peripheralDetails.screenSizeInch} onChange={(v) => setPeripheralDetails((s) => ({ ...s, screenSizeInch: v }))} />
          <TextField id="rd-resolution" label="Resolution" value={peripheralDetails.resolution} onChange={(v) => setPeripheralDetails((s) => ({ ...s, resolution: v }))} />
          <EnumSelectField id="rd-panel-type" label="Panel Type" value={peripheralDetails.panelType} onChange={(v) => setPeripheralDetails((s) => ({ ...s, panelType: v }))} options={PANEL_TYPES} />
          <TextField id="rd-refresh-rate" label="Refresh Rate (Hz)" type="number" value={peripheralDetails.refreshRateHz} onChange={(v) => setPeripheralDetails((s) => ({ ...s, refreshRateHz: v }))} />
          <CheckboxField id="rd-speaker" label="Has Speaker" checked={peripheralDetails.hasSpeaker} onChange={(v) => setPeripheralDetails((s) => ({ ...s, hasSpeaker: v }))} />
          <EnumSelectField id="rd-mount" label="Mount Type" value={peripheralDetails.mountType} onChange={(v) => setPeripheralDetails((s) => ({ ...s, mountType: v }))} options={MOUNT_TYPES} />
        </Section>
      )}

      {isMobileIot && (
        <Section title="Mobile & IoT/OT Details">
          <TextField id="id-imei" label="IMEI" value={mobileIotDetails.imei} onChange={(v) => setMobileIotDetails((s) => ({ ...s, imei: v }))} />
          <TextField id="id-phone" label="Phone Number" value={mobileIotDetails.phoneNumber} onChange={(v) => setMobileIotDetails((s) => ({ ...s, phoneNumber: v }))} />
          <TextField id="id-sim" label="SIM Provider" value={mobileIotDetails.simProvider} onChange={(v) => setMobileIotDetails((s) => ({ ...s, simProvider: v }))} />
          <TextField id="id-os-name" label="OS Name" value={mobileIotDetails.osName} onChange={(v) => setMobileIotDetails((s) => ({ ...s, osName: v }))} />
          <TextField id="id-os-version" label="OS Version" value={mobileIotDetails.osVersion} onChange={(v) => setMobileIotDetails((s) => ({ ...s, osVersion: v }))} />
          <CheckboxField id="id-mdm" label="MDM Enrolled" checked={mobileIotDetails.isMdmEnrolled} onChange={(v) => setMobileIotDetails((s) => ({ ...s, isMdmEnrolled: v }))} />
          <TextField id="id-mdm-platform" label="MDM Platform" value={mobileIotDetails.mdmPlatform} onChange={(v) => setMobileIotDetails((s) => ({ ...s, mdmPlatform: v }))} />
          <TextField id="id-hostname" label="Hostname" value={mobileIotDetails.hostname} onChange={(v) => setMobileIotDetails((s) => ({ ...s, hostname: v }))} />
          <TextField id="id-mac" label="MAC Address" value={mobileIotDetails.macAddress} onChange={(v) => setMobileIotDetails((s) => ({ ...s, macAddress: v }))} />
          <TextField id="id-firmware" label="Firmware Version" value={mobileIotDetails.firmwareVersion} onChange={(v) => setMobileIotDetails((s) => ({ ...s, firmwareVersion: v }))} />
          <EnumSelectField id="id-protocol" label="Device Protocol" value={mobileIotDetails.deviceProtocol} onChange={(v) => setMobileIotDetails((s) => ({ ...s, deviceProtocol: v }))} options={DEVICE_PROTOCOLS} />
          <TextField id="id-controller" label="Controller Model" value={mobileIotDetails.controllerModel} onChange={(v) => setMobileIotDetails((s) => ({ ...s, controllerModel: v }))} />
          <TextField id="id-io-points" label="I/O Point Count" type="number" value={mobileIotDetails.ioPointCount} onChange={(v) => setMobileIotDetails((s) => ({ ...s, ioPointCount: v }))} />
          <TextField id="id-resolution" label="Resolution" value={mobileIotDetails.resolution} onChange={(v) => setMobileIotDetails((s) => ({ ...s, resolution: v }))} />
          <CheckboxField id="id-ptz" label="Has PTZ" checked={mobileIotDetails.hasPtz} onChange={(v) => setMobileIotDetails((s) => ({ ...s, hasPtz: v }))} />
          <CheckboxField id="id-ir" label="Has IR" checked={mobileIotDetails.hasIr} onChange={(v) => setMobileIotDetails((s) => ({ ...s, hasIr: v }))} />
          <EnumSelectField id="id-storage-type" label="Storage Type" value={mobileIotDetails.storageType} onChange={(v) => setMobileIotDetails((s) => ({ ...s, storageType: v }))} options={IOT_STORAGE_TYPES} />
          <TextField id="id-assigned-to" label="Assigned To" value={mobileIotDetails.assignedToName} onChange={(v) => setMobileIotDetails((s) => ({ ...s, assignedToName: v }))} />
          <TextField id="id-assigned-date" label="Assigned Date" type="date" value={mobileIotDetails.assignedDate} onChange={(v) => setMobileIotDetails((s) => ({ ...s, assignedDate: v }))} />
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
