"use client";

import { LookupPage } from "@/components/lookups/lookup-page";
import { accessLevelsConfig } from "@/lib/lookups/configs";

export default function Page() {
  return <LookupPage config={accessLevelsConfig} />;
}
