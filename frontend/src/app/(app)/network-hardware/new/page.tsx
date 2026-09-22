"use client";

import { NetworkHardwareForm } from "@/components/network-hardware/network-hardware-form";

export default function NewNetworkHardwarePage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Add — Network Hardware</h1>
      <p className="mt-1 text-sm text-text-secondary">ลงทะเบียนสวิตช์ / ไฟร์วอลล์ / อุปกรณ์เครือข่ายอื่นๆ เข้าระบบ</p>
      <div className="mt-4 max-w-3xl">
        <NetworkHardwareForm />
      </div>
    </div>
  );
}
