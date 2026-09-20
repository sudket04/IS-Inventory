"use client";

import Link from "next/link";
import { ALL_LOOKUP_CONFIGS } from "@/lib/lookups/configs";

export default function MasterDataIndexPage() {
  const groups = Array.from(new Set(ALL_LOOKUP_CONFIGS.map((c) => c.group)));

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-text-primary">Master Data</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Lookup values referenced across the system. Records still in use can&apos;t be deleted —
        deactivate them instead.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group} className="rounded-md border border-border-default bg-bg-surface p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{group}</h2>
            <ul className="mt-2 space-y-1">
              {ALL_LOOKUP_CONFIGS.filter((c) => c.group === group).map(({ config }) => (
                <li key={config.key}>
                  <Link
                    href={`/admin/master-data/${config.key}`}
                    className="block rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-bg-subtle"
                  >
                    {config.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
