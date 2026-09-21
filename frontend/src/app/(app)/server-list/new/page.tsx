"use client";

import { ServerListForm } from "@/components/server-domain/server-list-form";

export default function NewServerListPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Add — Server List</h1>
      <p className="mt-1 text-sm text-text-secondary">Virtual: กรอก CPU/Memory/Storage เอง · Physical: เลือกเครื่องจาก Server Inventory</p>
      <div className="mt-4 max-w-3xl">
        <ServerListForm />
      </div>
    </div>
  );
}
