// Runs every registry scraper and writes data/registries/index.json.
// Usage: node scripts/registries/all.mjs [ng] [ke] [ug] [gh]   (no args = all)
//
// index.json shape (consumed by src/lib/registry/load.ts as RegistryIndexNote):
//   { generated, generated_at, countries: [{ country, source, source_url, as_of, count, method, notes, ok, run_notes }] }
// `source` and `notes` are strings; `run_notes` keeps the scraper's itemised notes.
import path from 'node:path';
import { OUT_DIR, writeJson, readJsonIfExists, today } from './lib.mjs';
import { run as ng } from './ng.mjs';
import { run as ug } from './ug.mjs';
import { run as gh } from './gh.mjs';
import { run as ke } from './ke.mjs';

const SCRAPERS = { ng, ke, ug, gh };
const ORDER = ['NG', 'KE', 'UG', 'GH'];
const INDEX = path.join(OUT_DIR, 'index.json');

const wanted = process.argv.slice(2).map((s) => s.toLowerCase()).filter((s) => s in SCRAPERS);
const keys = wanted.length ? wanted : Object.keys(SCRAPERS);

const asList = (n) => (Array.isArray(n) ? n.map(String) : n ? [String(n)] : []);
const sourceName = (s) => (typeof s === 'string' ? s : s?.name ?? null);
const sourceUrl = (s) => (typeof s === 'object' && s ? s.url ?? null : null);

// Normalise a previous index row (either this shape or an older one) so a failed run can keep it.
function normaliseRow(row) {
  if (!row) return null;
  return {
    country: row.country,
    source: sourceName(row.source),
    source_url: row.source_url ?? sourceUrl(row.source),
    as_of: row.as_of ?? null,
    count: row.count ?? 0,
    method: row.method ?? (typeof row.source === 'object' ? row.source?.method : null) ?? null,
    notes: typeof row.notes === 'string' ? row.notes : asList(row.notes).join(' '),
    ok: row.ok ?? true,
    run_notes: asList(row.run_notes ?? (Array.isArray(row.notes) ? row.notes : [])),
    file: row.file ?? `data/registries/${String(row.country).toLowerCase()}.json`,
  };
}

const existing = (await readJsonIfExists(INDEX)) || {};
const results = new Map((existing.countries || []).map((r) => [r.country, normaliseRow(r)]).filter(([c]) => c));

for (const key of keys) {
  const country = key.toUpperCase();
  const started = Date.now();
  try {
    const r = await SCRAPERS[key]();
    const notes = asList(r.notes);
    const prev = results.get(country);
    results.set(country, {
      country,
      source: sourceName(r.source),
      source_url: sourceUrl(r.source),
      as_of: r.as_of,
      count: r.count,
      method: r.method,
      // The hand-written caveat for each register lives in `notes`; scraper output goes to `run_notes`.
      notes: prev?.notes || notes.join(' '),
      ok: true,
      run_notes: notes,
      duration_s: Math.round((Date.now() - started) / 1000),
      file: `data/registries/${key}.json`,
    });
  } catch (e) {
    const prev = results.get(country) || normaliseRow({ country });
    const snap = await readJsonIfExists(path.join(OUT_DIR, `${key}.json`));
    const msg = `Run on ${today()} failed: ${e.message}.${snap ? ` Previous snapshot (as_of ${snap.as_of}, ${snap.count} entries) kept on disk.` : ' No snapshot on disk.'}`;
    results.set(country, {
      ...prev,
      source: prev.source ?? sourceName(snap?.source),
      source_url: prev.source_url ?? sourceUrl(snap?.source),
      as_of: snap?.as_of ?? prev.as_of,
      count: snap?.count ?? prev.count,
      method: prev.method ?? snap?.source?.method ?? null,
      notes: [msg, prev.notes].filter(Boolean).join(' '),
      ok: false,
      error: e.message,
      failed_at: today(),
      run_notes: [msg, ...prev.run_notes],
    });
    console.error(`[all] ${key} failed:`, e.message);
  }
}

const index = {
  generated: today(),
  generated_at: new Date().toISOString(),
  schema: 'registry snapshot index v1',
  countries: ORDER.filter((c) => results.has(c)).map((c) => results.get(c)),
};
await writeJson(INDEX, index);
console.log('[all] index written:', index.countries.map((c) => `${c.country}=${c.count}${c.ok ? '' : ' (FAILED, previous kept)'}`).join(', '));
