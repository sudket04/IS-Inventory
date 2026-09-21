"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { Section, TextField, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyVlanForm, type VlanDetail, type VlanForm as VlanFormState } from "@/lib/vlans/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

// Mirrors CHECK constraints in docs/database/04-vlan-module.sql §3.
const NETWORK_LEVELS = ["PRIMARY", "SECONDARY"];
const GATEWAY_ROLES = ["FIREWALL", "CORE_SWITCH", "L3_SWITCH", "ROUTER", "OTHER"];
const IP_ASSIGNMENT_MODES = ["STATIC_ONLY", "DHCP_ONLY", "MIXED"];
const DHCP_SOURCE_TYPES = ["FIREWALL", "CORE_SWITCH", "L3_SWITCH", "ROUTER", "DHCP_SERVER", "EXTERNAL"];

export function VlanForm({ existing }: { existing?: VlanDetail }) {
  const router = useRouter();
  const zones = usePicker("network-zones");
  const sites = usePicker("vlan-sites");
  const assets = usePicker("assets");

  const [form, setForm] = React.useState<VlanFormState>(() =>
    existing
      ? {
          vlanNumber: existing.vlanNumber != null ? String(existing.vlanNumber) : "",
          isUntagged: existing.isUntagged,
          name: existing.name,
          description: existing.description ?? "",
          zoneId: String(existing.zoneId),
          networkLevel: existing.networkLevel,
          networkAddress: existing.networkAddress,
          prefixLength: String(existing.prefixLength),
          gatewayIp: existing.gatewayIp ?? "",
          gatewayDeviceRole: existing.gatewayDeviceRole ?? "",
          gatewayAssetId: existing.gatewayAssetId != null ? String(existing.gatewayAssetId) : "",
          gatewayInterface: existing.gatewayInterface ?? "",
          ipAssignmentMode: existing.ipAssignmentMode,
          dhcpSourceType: existing.dhcpSourceType ?? "",
          dhcpServerAssetId: existing.dhcpServerAssetId != null ? String(existing.dhcpServerAssetId) : "",
          dhcpServerNameRaw: existing.dhcpServerNameRaw ?? "",
          dhcpRelayIp: existing.dhcpRelayIp ?? "",
          dhcpLeaseHours: existing.dhcpLeaseHours != null ? String(existing.dhcpLeaseHours) : "",
          dnsPrimary: existing.dnsPrimary ?? "",
          dnsSecondary: existing.dnsSecondary ?? "",
          domainName: existing.domainName ?? "",
          siteId: String(existing.siteId),
          isActive: existing.isActive,
          notes: existing.notes ?? "",
        }
      : emptyVlanForm
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isStaticOnly = form.ipAssignmentMode === "STATIC_ONLY";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      vlanNumber: form.isUntagged ? null : num(form.vlanNumber),
      isUntagged: form.isUntagged,
      name: form.name.trim(),
      description: str(form.description),
      zoneId: Number(form.zoneId),
      networkLevel: form.networkLevel,
      networkAddress: form.networkAddress.trim(),
      prefixLength: Number(form.prefixLength),
      gatewayIp: str(form.gatewayIp),
      gatewayDeviceRole: str(form.gatewayDeviceRole),
      gatewayAssetId: num(form.gatewayAssetId),
      gatewayInterface: str(form.gatewayInterface),
      ipAssignmentMode: form.ipAssignmentMode,
      dhcpSourceType: isStaticOnly ? null : str(form.dhcpSourceType),
      dhcpServerAssetId: isStaticOnly ? null : num(form.dhcpServerAssetId),
      dhcpServerNameRaw: isStaticOnly ? null : str(form.dhcpServerNameRaw),
      dhcpRelayIp: isStaticOnly ? null : str(form.dhcpRelayIp),
      dhcpLeaseHours: isStaticOnly ? null : num(form.dhcpLeaseHours),
      dnsPrimary: str(form.dnsPrimary),
      dnsSecondary: str(form.dnsSecondary),
      domainName: str(form.domainName),
      siteId: Number(form.siteId),
      isActive: form.isActive,
      notes: str(form.notes),
    };

    const res = existing
      ? await apiFetch(`/api/vlans/${existing.vlanId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/vlans", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/vlans/${saved.vlanId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the VLAN.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Basic Information">
        <TextField id="name" label="Name" required value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <CheckboxField id="isUntagged" label="Untagged (no 802.1Q number)" checked={form.isUntagged} onChange={(v) => setForm((f) => ({ ...f, isUntagged: v, vlanNumber: v ? "" : f.vlanNumber }))} />
        {!form.isUntagged && (
          <TextField id="vlanNumber" label="VLAN Number (1–4094)" type="number" required value={form.vlanNumber} onChange={(v) => setForm((f) => ({ ...f, vlanNumber: v }))} />
        )}
        <SelectField id="zoneId" label="Network Zone" required value={form.zoneId} onChange={(v) => setForm((f) => ({ ...f, zoneId: v }))} options={zones} />
        <SelectField id="siteId" label="Site" required value={form.siteId} onChange={(v) => setForm((f) => ({ ...f, siteId: v }))} options={sites} />
        <EnumSelectField id="networkLevel" label="Subnet Level" required options={NETWORK_LEVELS} value={form.networkLevel} onChange={(v) => setForm((f) => ({ ...f, networkLevel: v }))} />
        <CheckboxField id="isActive" label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
        <div className="col-span-full space-y-1.5">
          <label className="text-sm font-medium text-text-primary" htmlFor="description">Description</label>
          <input id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary" />
        </div>
      </Section>

      <Section title="Subnet">
        <TextField id="networkAddress" label="Network Address" required value={form.networkAddress} onChange={(v) => setForm((f) => ({ ...f, networkAddress: v }))} />
        <TextField id="prefixLength" label="Prefix Length" type="number" required value={form.prefixLength} onChange={(v) => setForm((f) => ({ ...f, prefixLength: v }))} />
      </Section>

      <Section title="Gateway">
        <TextField id="gatewayIp" label="Gateway IP" value={form.gatewayIp} onChange={(v) => setForm((f) => ({ ...f, gatewayIp: v }))} />
        <EnumSelectField id="gatewayDeviceRole" label="Gateway Device Role" options={GATEWAY_ROLES} value={form.gatewayDeviceRole} onChange={(v) => setForm((f) => ({ ...f, gatewayDeviceRole: v }))} />
        <SelectField id="gatewayAssetId" label="Gateway Asset" value={form.gatewayAssetId} onChange={(v) => setForm((f) => ({ ...f, gatewayAssetId: v }))} options={assets} />
        <TextField id="gatewayInterface" label="Gateway Interface" value={form.gatewayInterface} onChange={(v) => setForm((f) => ({ ...f, gatewayInterface: v }))} />
      </Section>

      <Section title="IP Assignment">
        <EnumSelectField id="ipAssignmentMode" label="Assignment Mode" required options={IP_ASSIGNMENT_MODES} value={form.ipAssignmentMode} onChange={(v) => setForm((f) => ({ ...f, ipAssignmentMode: v }))} />
        {!isStaticOnly && (
          <>
            <EnumSelectField id="dhcpSourceType" label="DHCP Source" required options={DHCP_SOURCE_TYPES} value={form.dhcpSourceType} onChange={(v) => setForm((f) => ({ ...f, dhcpSourceType: v }))} />
            <SelectField id="dhcpServerAssetId" label="DHCP Server Asset" value={form.dhcpServerAssetId} onChange={(v) => setForm((f) => ({ ...f, dhcpServerAssetId: v }))} options={assets} />
            <TextField id="dhcpServerNameRaw" label="DHCP Server Name (if not tracked as an Asset)" value={form.dhcpServerNameRaw} onChange={(v) => setForm((f) => ({ ...f, dhcpServerNameRaw: v }))} />
            <TextField id="dhcpRelayIp" label="DHCP Relay IP" value={form.dhcpRelayIp} onChange={(v) => setForm((f) => ({ ...f, dhcpRelayIp: v }))} />
            <TextField id="dhcpLeaseHours" label="DHCP Lease Hours" type="number" value={form.dhcpLeaseHours} onChange={(v) => setForm((f) => ({ ...f, dhcpLeaseHours: v }))} />
          </>
        )}
      </Section>

      <Section title="DNS">
        <TextField id="dnsPrimary" label="Primary DNS" value={form.dnsPrimary} onChange={(v) => setForm((f) => ({ ...f, dnsPrimary: v }))} />
        <TextField id="dnsSecondary" label="Secondary DNS" value={form.dnsSecondary} onChange={(v) => setForm((f) => ({ ...f, dnsSecondary: v }))} />
        <TextField id="domainName" label="Domain Name" value={form.domainName} onChange={(v) => setForm((f) => ({ ...f, domainName: v }))} />
      </Section>

      <Section title="Notes">
        <div className="col-span-full space-y-1.5">
          <textarea
            aria-label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="h-24 w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/vlans")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create VLAN"}
        </Button>
      </div>
    </form>
  );
}
