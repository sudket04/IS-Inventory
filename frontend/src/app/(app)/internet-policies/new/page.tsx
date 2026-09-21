"use client";

import { InternetPolicyForm } from "@/components/permission-control/internet-policy-form";

export default function NewInternetPolicyPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">New Internet Policy</h1>
      <p className="mt-1 text-sm text-text-secondary">AD group and optional web-category rules bind after the policy is created.</p>
      <div className="mt-4 max-w-2xl">
        <InternetPolicyForm />
      </div>
    </div>
  );
}
