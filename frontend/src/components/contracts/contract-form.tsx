"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePicker } from "@/lib/assets/options";
import { Section, TextField, SelectField, EnumSelectField, CheckboxField } from "@/components/assets/form-fields";
import { emptyContractForm, type ContractDetail, type ContractForm as ContractFormState } from "@/lib/contracts/types";

const str = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

// Mirrors CHECK constraints in docs/database/12-module-v1.4-contracts-temporal.sql §2.
const CONTRACT_TYPES = ["WARRANTY", "MA", "SUPPORT", "SUBSCRIPTION", "LEASE", "RENTAL", "LICENSE", "INSURANCE"];
const CONTRACT_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED", "SUPERSEDED"];
const COVERAGE_HOURS = ["5x8", "8x5", "12x5", "24x5", "24x7"];
const SERVICE_TYPES = ["ONSITE", "RETURN_TO_BASE", "REMOTE", "PARTS_ONLY", "ADVANCE_EXCHANGE"];

export function ContractForm({ existing }: { existing?: ContractDetail }) {
  const router = useRouter();
  const vendors = usePicker("vendors");
  const users = usePicker("users");
  const contracts = usePicker("contracts").filter((c) => !existing || c.id !== existing.contractId);

  const [form, setForm] = React.useState<ContractFormState>(() =>
    existing
      ? {
          contractNo: existing.contractNo,
          vendorContractNo: existing.vendorContractNo ?? "",
          contractType: existing.contractType,
          vendorId: existing.vendorId != null ? String(existing.vendorId) : "",
          previousContractId: existing.previousContractId != null ? String(existing.previousContractId) : "",
          startDate: existing.startDate,
          endDate: existing.endDate,
          contractValue: existing.contractValue?.toString() ?? "",
          currency: existing.currency,
          exchangeRate: existing.exchangeRate?.toString() ?? "",
          poNumber: existing.poNumber ?? "",
          coverageHours: existing.coverageHours ?? "",
          serviceType: existing.serviceType ?? "",
          slaResponseHours: existing.slaResponseHours?.toString() ?? "",
          slaResolutionHours: existing.slaResolutionHours?.toString() ?? "",
          autoRenew: existing.autoRenew,
          renewalNoticeDays: existing.renewalNoticeDays?.toString() ?? "",
          status: existing.status,
          ownerUserId: existing.ownerUserId != null ? String(existing.ownerUserId) : "",
          contactPerson: existing.contactPerson ?? "",
          contactPhone: existing.contactPhone ?? "",
          contactEmail: existing.contactEmail ?? "",
          notes: existing.notes ?? "",
        }
      : emptyContractForm
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      contractNo: form.contractNo.trim(),
      vendorContractNo: str(form.vendorContractNo),
      contractType: form.contractType,
      vendorId: num(form.vendorId),
      previousContractId: num(form.previousContractId),
      startDate: form.startDate,
      endDate: form.endDate,
      contractValue: form.contractValue.trim() === "" ? null : Number(form.contractValue),
      currency: form.currency.trim() || "THB",
      exchangeRate: form.exchangeRate.trim() === "" ? null : Number(form.exchangeRate),
      poNumber: str(form.poNumber),
      coverageHours: str(form.coverageHours),
      serviceType: str(form.serviceType),
      slaResponseHours: num(form.slaResponseHours),
      slaResolutionHours: num(form.slaResolutionHours),
      autoRenew: form.autoRenew,
      renewalNoticeDays: num(form.renewalNoticeDays),
      status: form.status,
      ownerUserId: num(form.ownerUserId),
      contactPerson: str(form.contactPerson),
      contactPhone: str(form.contactPhone),
      contactEmail: str(form.contactEmail),
      notes: str(form.notes),
    };

    const res = existing
      ? await apiFetch(`/api/contracts/${existing.contractId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("/api/contracts", { method: "POST", body: JSON.stringify(body) });

    setSubmitting(false);

    if (res.ok) {
      const saved = await res.json();
      router.push(`/contracts/${saved.contractId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Could not save the contract.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Basic Information">
        <TextField id="contractNo" label="Contract No." required value={form.contractNo} onChange={(v) => setForm((f) => ({ ...f, contractNo: v }))} />
        <TextField id="vendorContractNo" label="Vendor Contract No." value={form.vendorContractNo} onChange={(v) => setForm((f) => ({ ...f, vendorContractNo: v }))} />
        <EnumSelectField id="contractType" label="Contract Type" required options={CONTRACT_TYPES} value={form.contractType} onChange={(v) => setForm((f) => ({ ...f, contractType: v }))} />
        <SelectField id="vendorId" label="Vendor" value={form.vendorId} onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))} options={vendors} />
        <SelectField id="previousContractId" label="Renews From (previous contract)" value={form.previousContractId} onChange={(v) => setForm((f) => ({ ...f, previousContractId: v }))} options={contracts} />
        <EnumSelectField id="status" label="Status" required options={CONTRACT_STATUSES} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
      </Section>

      <Section title="Period & Value">
        <TextField id="startDate" label="Start Date" type="date" required value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
        <TextField id="endDate" label="End Date" type="date" required value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
        <TextField id="contractValue" label="Contract Value" type="number" value={form.contractValue} onChange={(v) => setForm((f) => ({ ...f, contractValue: v }))} />
        <TextField id="currency" label="Currency" value={form.currency} onChange={(v) => setForm((f) => ({ ...f, currency: v }))} />
        <TextField id="exchangeRate" label="Exchange Rate" type="number" value={form.exchangeRate} onChange={(v) => setForm((f) => ({ ...f, exchangeRate: v }))} />
        <TextField id="poNumber" label="PO Number" value={form.poNumber} onChange={(v) => setForm((f) => ({ ...f, poNumber: v }))} />
      </Section>

      <Section title="Service Level">
        <EnumSelectField id="coverageHours" label="Coverage Hours" options={COVERAGE_HOURS} value={form.coverageHours} onChange={(v) => setForm((f) => ({ ...f, coverageHours: v }))} />
        <EnumSelectField id="serviceType" label="Service Type" options={SERVICE_TYPES} value={form.serviceType} onChange={(v) => setForm((f) => ({ ...f, serviceType: v }))} />
        <TextField id="slaResponseHours" label="SLA Response (hours)" type="number" value={form.slaResponseHours} onChange={(v) => setForm((f) => ({ ...f, slaResponseHours: v }))} />
        <TextField id="slaResolutionHours" label="SLA Resolution (hours)" type="number" value={form.slaResolutionHours} onChange={(v) => setForm((f) => ({ ...f, slaResolutionHours: v }))} />
      </Section>

      <Section title="Renewal">
        <CheckboxField id="autoRenew" label="Auto Renew" checked={form.autoRenew} onChange={(v) => setForm((f) => ({ ...f, autoRenew: v }))} />
        <TextField id="renewalNoticeDays" label="Renewal Notice (days)" type="number" value={form.renewalNoticeDays} onChange={(v) => setForm((f) => ({ ...f, renewalNoticeDays: v }))} />
      </Section>

      <Section title="Ownership & Contact">
        <SelectField id="ownerUserId" label="Contract Owner" value={form.ownerUserId} onChange={(v) => setForm((f) => ({ ...f, ownerUserId: v }))} options={users} />
        <TextField id="contactPerson" label="Contact Person" value={form.contactPerson} onChange={(v) => setForm((f) => ({ ...f, contactPerson: v }))} />
        <TextField id="contactPhone" label="Contact Phone" value={form.contactPhone} onChange={(v) => setForm((f) => ({ ...f, contactPhone: v }))} />
        <TextField id="contactEmail" label="Contact Email" value={form.contactEmail} onChange={(v) => setForm((f) => ({ ...f, contactEmail: v }))} />
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
        <Button type="button" variant="outline" onClick={() => router.push("/contracts")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create Contract"}
        </Button>
      </div>
    </form>
  );
}
