"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { Option } from "@/lib/assets/types";
import type { AvailableHardwareItem, UsedWithItem } from "@/lib/server-domain/types";

export interface AssetTypeOption {
  id: number; code: string; name: string; fullPath: string; isVirtual: boolean; canHostVm: boolean;
  parentTypeId: number | null; typeLevel: number;
}

/** Category+isVirtual-scoped Asset Type tree (Type + Subtype rows both included — the form
 * shows subtypes only, since that's the level a real device actually is). */
export function useAssetTypes(categoryCode: string, isVirtual?: boolean): AssetTypeOption[] {
  const [options, setOptions] = React.useState<AssetTypeOption[]>([]);
  React.useEffect(() => {
    const qs = new URLSearchParams({ categoryCode });
    if (isVirtual !== undefined) qs.set("isVirtual", String(isVirtual));
    apiFetch(`/api/pickers/asset-types?${qs}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: AssetTypeOption[]) => setOptions(rows.filter((r) => r.typeLevel === 2)))
      .catch(() => setOptions([]));
  }, [categoryCode, isVirtual]);
  return options;
}

export interface OsTypeOption { id: number; code: string; name: string }
export interface OsVersionOption { id: number; osTypeId: number; name: string }

/** OS Type/Version — the one Master Data pair with an inline "+" quick-add straight from the
 * consuming form, per explicit request, instead of Admin > Master Data. */
export function useOsCatalog() {
  const [types, setTypes] = React.useState<OsTypeOption[]>([]);
  const [versions, setVersions] = React.useState<OsVersionOption[]>([]);

  const loadTypes = React.useCallback(() => {
    apiFetch("/api/os-types").then((res) => (res.ok ? res.json() : [])).then(setTypes).catch(() => setTypes([]));
  }, []);
  const loadVersions = React.useCallback((osTypeId: number) => {
    apiFetch(`/api/os-versions?osTypeId=${osTypeId}`).then((res) => (res.ok ? res.json() : [])).then(setVersions).catch(() => setVersions([]));
  }, []);

  React.useEffect(() => { loadTypes(); }, [loadTypes]);

  async function addType(name: string): Promise<OsTypeOption | null> {
    const res = await apiFetch("/api/os-types", { method: "POST", body: JSON.stringify({ name }) });
    if (!res.ok) return null;
    const created: OsTypeOption = await res.json();
    loadTypes();
    return created;
  }

  async function addVersion(osTypeId: number, name: string): Promise<OsVersionOption | null> {
    const res = await apiFetch("/api/os-versions", { method: "POST", body: JSON.stringify({ osTypeId, name }) });
    if (!res.ok) return null;
    const created: OsVersionOption = await res.json();
    loadVersions(osTypeId);
    return created;
  }

  return { types, versions, loadVersions, addType, addVersion };
}

export function useClusters(): Option[] {
  const [options, setOptions] = React.useState<Option[]>([]);
  React.useEffect(() => {
    apiFetch("/api/pickers/clusters").then((res) => (res.ok ? res.json() : [])).then(setOptions).catch(() => setOptions([]));
  }, []);
  return options;
}

export function useServerStatuses(): Option[] {
  const [options, setOptions] = React.useState<Option[]>([]);
  React.useEffect(() => {
    apiFetch("/api/pickers/server-statuses").then((res) => (res.ok ? res.json() : [])).then(setOptions).catch(() => setOptions([]));
  }, []);
  return options;
}

export function useAvailableHardware(): AvailableHardwareItem[] {
  const [items, setItems] = React.useState<AvailableHardwareItem[]>([]);
  React.useEffect(() => {
    apiFetch("/api/server-list/available-hardware").then((res) => (res.ok ? res.json() : [])).then(setItems).catch(() => setItems([]));
  }, []);
  return items;
}

export function useAvailableClusterHardware(): AvailableHardwareItem[] {
  const [items, setItems] = React.useState<AvailableHardwareItem[]>([]);
  React.useEffect(() => {
    apiFetch("/api/clusters/available-hardware").then((res) => (res.ok ? res.json() : [])).then(setItems).catch(() => setItems([]));
  }, []);
  return items;
}

type NumberCatalogKind = "cpu-core-counts" | "ram-sizes" | "storage-sizes-gb" | "storage-sizes-tb";

/** CPU core count / RAM (GB) / Storage size (GB, TB) — catalogs of values that are actually
 * sold, extendable inline from the form with "+ Add" rather than free-typed numbers. */
export function useNumberCatalog(kind: NumberCatalogKind) {
  const [values, setValues] = React.useState<number[]>([]);

  const load = React.useCallback(() => {
    apiFetch(`/api/${kind}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { id: number; value: number }[]) => setValues(rows.map((r) => r.value)))
      .catch(() => setValues([]));
  }, [kind]);

  React.useEffect(() => { load(); }, [load]);

  async function add(value: number): Promise<boolean> {
    const res = await apiFetch(`/api/${kind}`, { method: "POST", body: JSON.stringify({ value }) });
    if (res.ok) load();
    return res.ok;
  }

  return { values, add };
}

/** "Used With" — which Cluster(s)/Server(s) a Storage Hardware asset serves. */
export function useUsedWith(assetId: number | undefined) {
  const [items, setItems] = React.useState<UsedWithItem[]>([]);

  const load = React.useCallback(() => {
    if (!assetId) return;
    apiFetch(`/api/server-inventory/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((detail: { usedWith?: UsedWithItem[] } | null) => setItems(detail?.usedWith ?? []))
      .catch(() => setItems([]));
  }, [assetId]);

  React.useEffect(() => { load(); }, [load]);

  async function save(targets: { type: "cluster" | "server"; id: number }[]): Promise<boolean> {
    if (!assetId) return false;
    const res = await apiFetch(`/api/server-inventory/${assetId}/used-with`, {
      method: "PUT",
      body: JSON.stringify({ targets }),
    });
    if (res.ok) setItems(await res.json());
    return res.ok;
  }

  return { items, save };
}
