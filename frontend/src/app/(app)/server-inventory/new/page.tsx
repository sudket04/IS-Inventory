"use client";

import { ServerInventoryForm } from "@/components/server-domain/server-inventory-form";

export default function NewServerInventoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Add — Server Inventory</h1>
      <p className="mt-1 text-sm text-text-secondary">ลงทะเบียน Server หรือ Storage เข้าระบบ</p>
      <div className="mt-4 max-w-3xl">
        <ServerInventoryForm />
      </div>
    </div>
  );
}
