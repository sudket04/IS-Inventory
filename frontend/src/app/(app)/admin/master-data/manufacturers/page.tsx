"use client";

import { LookupPage } from "@/components/lookups/lookup-page";
import { manufacturersConfig } from "@/lib/lookups/configs";

export default function Page() {
  return <LookupPage config={manufacturersConfig} />;
}
