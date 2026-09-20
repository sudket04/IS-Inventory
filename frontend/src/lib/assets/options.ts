"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { Option } from "@/lib/assets/types";

function usePicker(path: string): Option[] {
  const [options, setOptions] = React.useState<Option[]>([]);
  React.useEffect(() => {
    apiFetch(`/api/pickers/${path}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [path]);
  return options;
}

export function useAssetFormOptions() {
  return {
    categories: usePicker("asset-categories"),
    statuses: usePicker("asset-statuses"),
    manufacturers: usePicker("manufacturers"),
    vendors: usePicker("vendors"),
    locations: usePicker("locations"),
    departments: usePicker("departments"),
    users: usePicker("users"),
  };
}
