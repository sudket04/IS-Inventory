"use client";

import { FileShareForm } from "@/components/permission-control/file-share-form";

export default function NewFileSharePage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Register Folder</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manually-entered registry — sign-off matches what the File Server actually has, per FSRM/AD sync once Sprint 8 ships.
      </p>
      <div className="mt-4 max-w-3xl">
        <FileShareForm />
      </div>
    </div>
  );
}
