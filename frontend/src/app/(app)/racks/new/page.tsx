"use client";

import { RackForm } from "@/components/racks/rack-form";

export default function NewRackPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">New Rack</h1>
      <p className="mt-1 text-sm text-text-secondary">Physical rack cabinet.</p>
      <div className="mt-4">
        <RackForm />
      </div>
    </div>
  );
}
