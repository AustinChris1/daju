import type { Country } from "@/lib/countries";

const LEGAL_SUFFIX = /\b(limited|ltd|plc|llc|inc|co|company|corp|corporation|enterprises?|nig|nigeria|ghana|kenya|uganda|international|intl|global|group|services?|solutions?|consult(?:ing|ants?)?|agency|agencies|recruitment|recruiters?|staffing|manpower|resources?|hr|the)\b/g;

export function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Core name with legal and generic words removed, for looser comparison.
export function coreName(s: string): string {
  const core = normName(s).replace(LEGAL_SUFFIX, " ").replace(/\s+/g, " ").trim();
  return core.length >= 3 ? core : normName(s);
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  const t = s.replace(/\s+/g, " ");
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

export function dice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const [g, n] of A) inter += Math.min(n, B.get(g) ?? 0);
  const total = [...A.values()].reduce((x, y) => x + y, 0) + [...B.values()].reduce((x, y) => x + y, 0);
  return total ? (2 * inter) / total : 0;
}

export function tokenOverlap(a: string, b: string): number {
  const A = new Set(a.split(" ").filter((t) => t.length > 2));
  const B = new Set(b.split(" ").filter((t) => t.length > 2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size);
}

// Blend of full-name and core-name similarity. 1 = identical.
export function nameScore(query: string, candidate: string): number {
  const qn = normName(query);
  const cn = normName(candidate);
  const qc = coreName(query);
  const cc = coreName(candidate);
  const full = dice(qn, cn);
  const core = dice(qc, cc);
  const tok = tokenOverlap(qc, cc);
  const contains = qc.length >= 4 && (cn.includes(qc) || cc.includes(qc)) ? 0.9 : 0;
  return Math.max(full, core * 0.97, tok * 0.85, contains);
}

const DIALS: Record<Country, string> = { NG: "234", KE: "254", UG: "256", GH: "233" };

// Returns E.164 when the number is recognisably one of the four countries, else digits as given.
export function normPhone(raw: string, hint?: Country | null): string {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("+")) return "+" + d.slice(1).replace(/\D/g, "");
  d = d.replace(/\D/g, "");
  for (const c of Object.keys(DIALS) as Country[]) {
    if (d.startsWith(DIALS[c]) && d.length >= 12) return "+" + d;
  }
  if (d.startsWith("0") && d.length >= 10) {
    const local = d.slice(1);
    const c = hint ?? guessCountryFromLocal(local);
    if (c) return "+" + DIALS[c] + local;
  }
  return d;
}

function guessCountryFromLocal(local: string): Country | null {
  if (local.length === 10 && /^[789]/.test(local)) return "NG";
  if (local.length === 9 && /^[17]/.test(local)) return "KE";
  if (local.length === 9 && /^[73]/.test(local)) return "UG";
  if (local.length === 9 && /^[25]/.test(local)) return "GH";
  return null;
}

export function countryFromPhone(e164: string): Country | null {
  for (const c of Object.keys(DIALS) as Country[]) if (e164.startsWith("+" + DIALS[c])) return c;
  return null;
}

export function phoneTail(e164: string): string {
  return e164.replace(/\D/g, "").slice(-9);
}

export function domainOf(value: string): string | null {
  const v = value.trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at >= 0) return v.slice(at + 1).replace(/[^a-z0-9.-]/g, "") || null;
  try {
    const u = new URL(v.startsWith("http") ? v : "https://" + v);
    return u.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export const FREE_MAIL = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.uk", "ymail.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "aol.com", "proton.me", "protonmail.com", "mail.com", "zoho.com", "gmx.com", "yandex.com",
]);

export function isFreeMail(domain: string): boolean {
  return FREE_MAIL.has(domain.toLowerCase());
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let last = i;
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      last = Math.min(prev[j] + 1, last + 1, diag + cost);
      diag = tmp;
      prev[j] = last;
    }
  }
  return prev[n];
}
