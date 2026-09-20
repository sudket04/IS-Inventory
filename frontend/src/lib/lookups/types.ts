import type { ReactNode } from "react";

export type LookupRow = Record<string, unknown>;

export interface LookupField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select";
  required?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
}

export interface LookupColumn {
  key: string;
  label: string;
  render?: (row: LookupRow) => ReactNode;
}

export interface LookupConfig {
  /** Matches the backend route: /api/lookups/{key} */
  key: string;
  title: string;
  description: string;
  /** Property name of the primary key on the row, e.g. "departmentId" */
  idKey: string;
  columns: LookupColumn[];
  fields: LookupField[];
  /** Row keys the search box filters across */
  searchKeys: string[];
}
