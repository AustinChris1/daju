// Compares the register snapshots on disk with the last committed ones and records what moved.
// Usage: node scripts/registries/diff.mjs [--base <git-ref>] [--dry]
// Writes data/registries/changes.json (newest run first, last 12 runs kept) and prints a summary.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { OUT_DIR, ROOT, readJsonIfExists, writeJson, today } from './lib.mjs';

const COUNTRIES = ['NG', 'KE', 'UG', 'GH'];
const CHANGES = path.join(OUT_DIR, 'changes.json');
const LIST_CAP = 300;
const RUNS_KEPT = 12;

const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'HEAD';
const dry = args.includes('--dry');

function committed(country) {
  try {
    const out = execFileSync('git', ['show', `${base}:data/registries/${country.toLowerCase()}.json`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    return JSON.parse(out.toString('utf8'));
  } catch {
    return null;
  }
}

// Entries are matched by normalised name: ids are positional and licence numbers get reissued.
const keyOf = (e) => e.name_norm || String(e.name || '').toLowerCase();
const contactOf = (e) => [...(e.phones || []), ...(e.emails || [])].sort().join('|');
const brief = (e) => ({ id: e.id, name: e.name, status: e.status, license_no: e.license_no ?? null, valid_to: e.valid_to ?? null });

function diffCountry(country, before, after) {
  const prev = new Map((before?.entries || []).map((e) => [keyOf(e), e]));
  const next = new Map((after?.entries || []).map((e) => [keyOf(e), e]));
  const added = [];
  const removed = [];
  const statusChanges = [];
  const contactChanges = [];
  for (const [k, e] of next) {
    const old = prev.get(k);
    if (!old) {
      added.push(brief(e));
      continue;
    }
    if (old.status !== e.status) statusChanges.push({ ...brief(e), from: old.status, to: e.status });
    if (contactOf(old) !== contactOf(e)) contactChanges.push({ ...brief(e), before: contactOf(old).split('|').filter(Boolean), after: contactOf(e).split('|').filter(Boolean) });
  }
  for (const [k, e] of prev) if (!next.has(k)) removed.push(brief(e));
  const cap = (list) => list.slice(0, LIST_CAP);
  return {
    country,
    as_of_before: before?.as_of ?? null,
    as_of_after: after?.as_of ?? null,
    count_before: before?.entries?.length ?? 0,
    count_after: after?.entries?.length ?? 0,
    added_count: added.length,
    removed_count: removed.length,
    status_change_count: statusChanges.length,
    contact_change_count: contactChanges.length,
    added: cap(added),
    removed: cap(removed),
    status_changes: cap(statusChanges),
    contact_changes: cap(contactChanges),
  };
}

const countries = [];
for (const c of COUNTRIES) {
  const after = await readJsonIfExists(path.join(OUT_DIR, `${c.toLowerCase()}.json`));
  if (!after) continue;
  const before = committed(c);
  if (!before) continue;
  countries.push(diffCountry(c, before, after));
}

const moved = countries.filter((c) => c.added_count || c.removed_count || c.status_change_count || c.contact_change_count);
const line = (c) => {
  const parts = [];
  if (c.added_count) parts.push(`${c.added_count} added`);
  if (c.removed_count) parts.push(`${c.removed_count} removed`);
  if (c.status_change_count) parts.push(`${c.status_change_count} status change${c.status_change_count === 1 ? '' : 's'}`);
  if (c.contact_change_count) parts.push(`${c.contact_change_count} contact change${c.contact_change_count === 1 ? '' : 's'}`);
  return `${c.country}: ${parts.length ? parts.join(', ') : 'no change'} (${c.count_before} to ${c.count_after}, snapshot ${c.as_of_after})`;
};

const summary = countries.map(line).join('\n');
console.log(summary || '[diff] no committed snapshots to compare against');

if (moved.length && !dry) {
  const log = (await readJsonIfExists(CHANGES)) || { runs: [] };
  const run = { date: today(), base, countries: moved };
  log.runs = [run, ...(log.runs || []).filter((r) => r.date !== run.date)].slice(0, RUNS_KEPT);
  await writeJson(CHANGES, log);
  console.log(`[diff] recorded ${moved.length} moved register${moved.length === 1 ? '' : 's'} in data/registries/changes.json`);
}
