// Nigeria: NELEX registered private employment agencies (server-rendered, paginated HTML).
import path from 'node:path';
import {
  OUT_DIR, fetchText, sleep, today, clean, decodeCfEmail, extractEmails, makeEntry, writeJson, logger, isMain,
} from './lib.mjs';

const BASE = 'https://nelex.gov.ng/registered-private-employment-agencies';
const SOURCE = { name: 'NELEX, Federal Ministry of Labour and Employment', url: BASE, method: 'html-pagination' };
const log = logger('ng');
const PAGE_DELAY_MS = 350;
// a whole-page failure aborts the run (a partial snapshot is worse than the previous one), so retry hard
const FETCH = { retries: 7, timeoutMs: 45000 };

function lastPageFrom(html) {
  let max = 1;
  for (const m of html.matchAll(/registered-private-employment-agencies\?page=(\d+)/g)) max = Math.max(max, Number(m[1]));
  return max;
}

function parseRows(html, page) {
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbody) return [];
  const rows = tbody[1].split(/<tr>/i).slice(1);
  const out = [];
  for (const row of rows) {
    const tds = [...row.matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    if (tds.length < 5) continue;
    const [snTd, logoTd, infoTd, cacTd, statusTd] = tds;
    const name = clean((infoTd.match(/Name:\s*([\s\S]*?)<\/small>/i) || [])[1] || '');
    if (!name) continue;
    // Emails are Cloudflare-obfuscated (data-cfemail); fall back to plain text if not.
    const emails = [...infoTd.matchAll(/data-cfemail="([0-9a-f]+)"/gi)].map((m) => decodeCfEmail(m[1]));
    if (!emails.length) emails.push(...extractEmails(clean(infoTd)));
    const cacText = clean(cacTd);
    const statusText = clean(statusTd);
    const logo = (logoTd.match(/src="([^"]+)"/) || [])[1] || null;
    let cac = null;
    if (/not\s*verified|unverified|pending/i.test(cacText)) cac = false;
    else if (/verified/i.test(cacText)) cac = true;
    let status = 'unknown';
    if (/inactive|suspended|expired|revoked/i.test(statusText)) status = /revoked/i.test(statusText) ? 'revoked' : /expired/i.test(statusText) ? 'expired' : 'inactive';
    else if (/active/i.test(statusText) || /text-success/.test(statusTd)) status = 'active';
    out.push({
      name, emails, status, cac_verified: cac, type: 'private',
      raw: { sn: clean(snTd), logo, cac_text: cacText, status_text: statusText, page },
    });
  }
  return out;
}

export async function run() {
  const notes = [];
  const first = await fetchText(`${BASE}?page=1`, { ...FETCH, log });
  const lastPage = lastPageFrom(first.text);
  log(`page 1 ok (HTTP ${first.status}), ${lastPage} pages detected`);
  const rows = parseRows(first.text, 1);
  let emptyPages = 0;
  for (let p = 2; p <= lastPage; p++) {
    await sleep(PAGE_DELAY_MS);
    const { text, status } = await fetchText(`${BASE}?page=${p}`, { ...FETCH, log });
    const r = parseRows(text, p);
    if (!r.length) { emptyPages++; notes.push(`page ${p} returned no rows (HTTP ${status})`); }
    rows.push(...r);
    if (p % 10 === 0) log(`page ${p}/${lastPage}: ${rows.length} rows so far`);
  }
  // de-duplicate on name + emails (pagination can shift while scraping)
  const seen = new Set();
  const entries = [];
  for (const r of rows) {
    const key = `${r.name.toLowerCase()}|${r.emails.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(makeEntry('ng', entries.length + 1, 234, r));
  }
  const dupes = rows.length - entries.length;
  if (dupes) notes.push(`${dupes} duplicate rows dropped across pages`);
  const statusCounts = {};
  for (const e of entries) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  const cacCounts = { verified: entries.filter((e) => e.cac_verified === true).length, not_verified: entries.filter((e) => e.cac_verified === false).length, unknown: entries.filter((e) => e.cac_verified === null).length };
  notes.push(`status counts: ${JSON.stringify(statusCounts)}; CAC: ${JSON.stringify(cacCounts)}`);
  notes.push('NELEX lists no licence number, phone, address or licence dates; emails are Cloudflare-obfuscated in the HTML and were decoded.');
  const doc = { country: 'NG', source: SOURCE, as_of: today(), count: entries.length, entries };
  await writeJson(path.join(OUT_DIR, 'ng.json'), doc);
  log(`wrote ${entries.length} entries`);
  return { country: 'NG', source: SOURCE, as_of: doc.as_of, count: entries.length, method: SOURCE.method, notes, pages: lastPage, emptyPages };
}

if (isMain(import.meta.url)) run().catch((e) => { console.error(e); process.exit(1); });
