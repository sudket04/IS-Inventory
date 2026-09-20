"use client";

import { LookupPage } from "@/components/lookups/lookup-page";
import { relationshipTypesConfig } from "@/lib/lookups/configs";

export default function Page() {
  return <LookupPage config={relationshipTypesConfig} />;
}
