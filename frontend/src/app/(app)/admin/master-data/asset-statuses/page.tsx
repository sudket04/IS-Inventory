"use client";

import { LookupPage } from "@/components/lookups/lookup-page";
import { assetStatusesConfig } from "@/lib/lookups/configs";

export default function Page() {
  return <LookupPage config={assetStatusesConfig} />;
}
