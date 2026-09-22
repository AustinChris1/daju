import type { Country } from "@/lib/countries";

export type RegistryStatus = "active" | "inactive" | "expired" | "revoked" | "unknown";

export interface RegistryEntry {
  id: string;
  name: string;
  name_norm: string;
  status: RegistryStatus;
  license_no: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  domains: string[];
  address: string | null;
  valid_from: string | null;
  valid_to: string | null;
  type: "private" | "government" | null;
  cac_verified: boolean | null;
  raw?: Record<string, unknown>;
}

export interface RegistrySnapshot {
  country: Country;
  source: { name: string; url: string; method: string };
  as_of: string;
  count: number;
  entries: RegistryEntry[];
}

export interface RegistryIndexNote {
  country: Country;
  source: string;
  as_of: string;
  count: number;
  method: string;
  notes?: string;
}
