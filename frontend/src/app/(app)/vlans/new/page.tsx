"use client";

import { VlanForm } from "@/components/vlans/vlan-form";

export default function NewVlanPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">New VLAN</h1>
      <p className="mt-1 text-sm text-text-secondary">VLAN or Secondary subnet, with Site and Zone.</p>
      <div className="mt-4">
        <VlanForm />
      </div>
    </div>
  );
}
