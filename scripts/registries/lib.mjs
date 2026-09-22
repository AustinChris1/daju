// Shared helpers for the Daju registry scrapers.
// Pure Node (>=18): built-in fetch only, no native modules.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT_DIR = path.join(ROOT, 'data', 'registries');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
];
export const UA = USER_AGENTS[0];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const today = () => new Date().toISOString().slice(0, 10);

/** True when this module file is the one node was started with (standalone run). */
export function isMain(metaUrl) {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(path.resolve(process.argv[1])).href;
}

/**
 * Polite fetch: realistic browser headers, per-attempt timeout, exponential backoff,
 * and a different User-Agent on each retry (helps with naive bot filters).
 * Retries on network errors, timeouts, 403/429 and 5xx.
 */
export async function politeFetch(url, { headers = {}, retries = 4, timeoutMs = 45000, log = null } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: ctrl.signal,
        headers: {
          'User-Agent': USER_AGENTS[attempt % USER_AGENTS.length],
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...headers,
        },
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status === 403 || res.status >= 500) {
        const err = new Error(`HTTP ${res.status} for ${url}`);
        err.status = res.status;
        throw err;
      }
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < retries) {
        const wait = 800 * 2 ** attempt;
        if (log) log(`retry ${attempt + 1}/${retries} for ${url} after ${e.message} (wait ${wait}ms)`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

export async function fetchText(url, opts) {
  const res = await politeFetch(url, opts);
  return { res, status: res.status, text: await res.text() };
}

export async function fetchJson(url, opts = {}) {
  const res = await politeFetch(url, {
    ...opts,
    headers: { Accept: 'application/json, text/javascript, */*; q=0.01', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { res, status: res.status, text, json };
}

/* ---------- HTML helpers (regex-level, enough for these server-rendered pages) ---------- */

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  hellip: '…', ndash: '–', mdash: '—', copy: '©',
};
export function decodeEntities(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in NAMED_ENTITIES ? NAMED_ENTITIES[n.toLowerCase()] : m));
}
export function stripTags(s) {
  return decodeEntities(String(s ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
}
export function clean(s) {
  return stripTags(s).replace(/\s+/g, ' ').trim();
}
/** Decode a Cloudflare "email-protection" data-cfemail hex string. */
export function decodeCfEmail(hex) {
  if (!hex || hex.length < 4) return null;
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}

/* ---------- normalisation ---------- */

export function normName(name) {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const EMAIL_RE = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;
export function extractEmails(text) {
  const found = String(text ?? '').match(EMAIL_RE) || [];
  return uniq(found.map((e) => e.toLowerCase().replace(/\.+$/, '')));
}

// national significant number length once the trunk "0" is removed
const NSN_LEN = { 234: 10, 254: 9, 256: 9, 233: 9 };
/** Normalise one phone string to E.164 for the given calling code; returns the raw string if not parseable. */
export function phoneE164(raw, cc) {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  let d = trimmed.replace(/\D/g, '');
  if (!d) return null;
  const nsn = NSN_LEN[cc];
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith(String(cc)) && d.length === String(cc).length + nsn) return `+${d}`;
  if (d.startsWith('0') && d.length === nsn + 1) return `+${cc}${d.slice(1)}`;
  if (d.length === nsn && !d.startsWith('0')) return `+${cc}${d}`;
  return trimmed;
}
/** Split a free-text phone field into candidates and normalise each. */
export function phones(raw, cc) {
  if (!raw) return [];
  const parts = String(raw).split(/\s*(?:,|;|\/|\||\bor\b|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
  return uniq(parts.map((p) => phoneE164(p, cc)).filter(Boolean));
}

export function domainOf(value) {
  if (!value) return null;
  let v = String(value).trim().toLowerCase();
  if (!v || v === 'n/a' || v === 'na' || v === 'nil' || v === 'none' || v === '-') return null;
  if (v.includes('@')) v = v.split('@').pop();
  v = v.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');
  v = v.split(/[/?#:]/)[0].trim().replace(/\.+$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v)) return null;
  return v;
}
export function domainsFrom(emails = [], website = null) {
  return uniq([...emails.map(domainOf), domainOf(website)].filter(Boolean));
}
export function normWebsite(w) {
  if (!w) return null;
  const v = String(w).trim();
  if (!v || /^(n\/?a|nil|none|-)$/i.test(v)) return null;
  if (!domainOf(v)) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
/** Parse "Jul 15, 2026", "15 July 2026", "04 Nov, 2024", "2025-08-12", "12/08/2025" (d/m/y) to YYYY-MM-DD. */
export function parseDate(s) {
  if (!s) return null;
  const t = String(s).trim();
  let m;
  if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return iso(m[1], m[2], m[3]);
  if ((m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/))) return iso(m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], m[2]);
  if ((m = t.match(/^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})$/))) return iso(m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], m[1]);
  if ((m = t.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/))) return iso(m[3], m[2], m[1]);
  return null;
}
function iso(y, mo, d) {
  if (!y || !mo || !d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function uniq(arr) {
  return [...new Set(arr)];
}

/** Build a schema-conformant entry. `cc` is the numeric calling code used for phone normalisation. */
export function makeEntry(prefix, index, cc, f) {
  const emails = uniq(
    (f.emails || [])
      .map((e) => String(e).trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)),
  );
  const website = normWebsite(f.website);
  return {
    id: `${prefix}-${String(index).padStart(4, '0')}`,
    name: clean(f.name),
    name_norm: normName(f.name),
    status: f.status || 'unknown',
    license_no: f.license_no || null,
    emails,
    phones: uniq((f.phones || []).flatMap((p) => phones(p, cc))),
    website,
    domains: domainsFrom(emails, website),
    address: f.address ? clean(f.address) : null,
    valid_from: f.valid_from || null,
    valid_to: f.valid_to || null,
    type: f.type ?? null,
    cac_verified: f.cac_verified ?? null,
    raw: f.raw || {},
  };
}

export async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
export async function readJsonIfExists(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; }
}

export function logger(tag) {
  return (...a) => console.log(`[${tag}]`, ...a);
}
