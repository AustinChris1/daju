// Ghana: GLMIS (Ghana Labour Market Information System) employment agencies directory.
// Server-rendered cards, paginated with ?page=N. Pagination hrefs are HTML-entity encoded (&#x2F;...),
// so they are decoded before reading the last page number.
import path from 'node:path';
import {
  OUT_DIR, fetchText, sleep, today, clean, decodeEntities, extractEmails, parseDate, makeEntry, writeJson, logger, isMain,
} from './lib.mjs';

const BASE = 'https://www.glmis.gov.gh/employmentagencies';
const SOURCE = { name: 'GLMIS, Ministry of Employment and Labour Relations', url: BASE, method: 'html-pagination' };
const log = logger('gh');
const PAGE_DELAY_MS = 350;
const FETCH = { retries: 7, timeoutMs: 45000 };

const pageUrl = (p) => `${BASE}?type=&search=&regionStateId=&page=${p}`;

function lastPageFrom(html) {
  const decoded = decodeEntities(html);
  let max = 1;
  for (const m of decoded.matchAll(/employmentagencies\?[^"']*page=(\d+)/g)) max = Math.max(max, Number(m[1]));
  return max;
}

function attr(card, name) {
  // attributes appear either as name="v" or name=&quot;v&quot;
  const m = card.match(new RegExp(`${name}=(?:"([^"]*)"|&quot;([^&]*)&quot;)`, 'i'));
  return m ? decodeEntities(m[1] ?? m[2] ?? '').trim() : null;
}

function parseCards(html, page) {
  const chunks = html.split(/class="job-box bookmark-post/).slice(1);
  const out = [];
  for (const card of chunks) {
    const name = clean((card.match(/<a class="text-dark">([\s\S]*?)<\/a>/) || [])[1] || '') || attr(card, 'data-bs-itemName');
    if (!name) continue;
    const typeBadge = clean((card.match(/<span class="badge[^"]*">([^<]*)<\/span>/) || [])[1] || '');
    const emailBlock = (card.match(/<strong>Email:<\/strong>([\s\S]*?)<\/p>/i) || [])[1] || '';
    const location = clean((card.match(/<strong>Location:<\/strong>([\s\S]*?)<\/p>/i) || [])[1] || '') || null;
    const websiteBlock = (card.match(/<strong>Website:<\/strong>([\s\S]*?)<\/p>/i) || [])[1] || '';
    const website = clean((websiteBlock.match(/href="([^"]*)"/) || [])[1] || clean(websiteBlock)) || null;
    out.push({
      name, typeBadge, emails: extractEmails(clean(emailBlock)), location, website,
      dateRegistered: attr(card, 'data-bs-DateRegistered'),
      licenseStart: attr(card, 'data-bs-LicenseStart'),
      licenseEnd: attr(card, 'data-bs-LicenseEnd'),
      itemId: attr(card, 'data-bs-itemid'),
      contact: attr(card, 'data-bs-itemContact'),
      page,
    });
  }
  return out;
}

export async function run() {
  const notes = [];
  const first = await fetchText(pageUrl(1), { ...FETCH, log });
  const lastPage = lastPageFrom(first.text);
  log(`page 1 ok (HTTP ${first.status}), ${lastPage} pages detected`);
  const cards = parseCards(first.text, 1);
  for (let p = 2; p <= lastPage; p++) {
    await sleep(PAGE_DELAY_MS);
    const { text, status } = await fetchText(pageUrl(p), { ...FETCH, log });
    const c = parseCards(text, p);
    if (!c.length) notes.push(`page ${p} returned no cards (HTTP ${status})`);
    cards.push(...c);
    if (p % 10 === 0) log(`page ${p}/${lastPage}: ${cards.length} cards so far`);
  }
  const seen = new Set();
  const entries = [];
  const t = today();
  for (const c of cards) {
    const key = c.itemId || `${c.name.toLowerCase()}|${c.emails.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const valid_from = parseDate(c.licenseStart);
    const valid_to = parseDate(c.licenseEnd);
    // GLMIS shows no explicit licence status; derive it from the licence end date when one is present.
    let status = 'unknown';
    if (valid_to) status = valid_to >= t ? 'active' : 'expired';
    const type = /government/i.test(c.typeBadge) ? 'government' : /private/i.test(c.typeBadge) ? 'private' : null;
    entries.push(makeEntry('gh', entries.length + 1, 233, {
      name: c.name, status, license_no: null, emails: c.emails, phones: c.contact ? [c.contact] : [],
      website: c.website, address: c.location, valid_from, valid_to, type, cac_verified: null,
      raw: { glmis_id: c.itemId, type_badge: c.typeBadge, location: c.location, website_raw: c.website, date_registered: c.dateRegistered, license_start: c.licenseStart, license_end: c.licenseEnd, contact: c.contact, page: c.page },
    }));
  }
  const dupes = cards.length - entries.length;
  if (dupes) notes.push(`${dupes} duplicate cards dropped across pages`);
  const statusCounts = {};
  const typeCounts = {};
  for (const e of entries) { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1; typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; }
  notes.push(`status counts (derived from licence end date, GLMIS shows no explicit status): ${JSON.stringify(statusCounts)}; types: ${JSON.stringify(typeCounts)}`);
  notes.push('GLMIS has no licence number field; "Location" is usually a Ghana digital address (e.g. GD-211-0600). Government entries are public labour offices, not recruiters.');
  const doc = { country: 'GH', source: SOURCE, as_of: t, count: entries.length, entries };
  await writeJson(path.join(OUT_DIR, 'gh.json'), doc);
  log(`wrote ${entries.length} entries`);
  return { country: 'GH', source: SOURCE, as_of: t, count: entries.length, method: SOURCE.method, notes, pages: lastPage };
}

if (isMain(import.meta.url)) run().catch((e) => { console.error(e); process.exit(1); });
