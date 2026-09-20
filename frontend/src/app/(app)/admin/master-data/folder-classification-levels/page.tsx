"use client";

import { LookupPage } from "@/components/lookups/lookup-page";
import { folderClassificationLevelsConfig } from "@/lib/lookups/configs";

export default function Page() {
  return <LookupPage config={folderClassificationLevelsConfig} />;
}
