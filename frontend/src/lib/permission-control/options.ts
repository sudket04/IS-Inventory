"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { Option } from "@/lib/assets/types";
import type { ClassificationOption, AccessLevelOption } from "./types";

export function useClassificationOptions(): Option[] {
  const [options, setOptions] = React.useState<Option[]>([]);
  React.useEffect(() => {
    apiFetch("/api/pickers/classification-levels")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: ClassificationOption[]) =>
        setOptions(items.map((c) => ({ id: c.id, label: `${c.nameEn} (rank ${c.sensitivityRank})` })))
      )
      .catch(() => setOptions([]));
  }, []);
  return options;
}

export function useAccessLevelOptions(): Option[] {
  const [options, setOptions] = React.useState<Option[]>([]);
  React.useEffect(() => {
    apiFetch("/api/pickers/access-levels")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: AccessLevelOption[]) => setOptions(items.map((a) => ({ id: a.id, label: a.nameEn }))))
      .catch(() => setOptions([]));
  }, []);
  return options;
}
