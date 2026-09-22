// Uganda: EEMIS (Ministry of Gender, Labour and Social Development) licensed external recruitment companies.
// The public page renders 20 cards and a "Load More" button that calls
// GET /ajax_calls/load_comp?lid=<last id>&pp=<per page>&s=<search>. Passing a huge lid and pp returns
// the whole list in one JSON response. Each company detail page adds licence no, dates, address and email.
import path from 'node:path';
import {
  OUT_DIR, fetchJson, fetchText, sleep, today, clean, stripTags, extractEmails, parseDate, makeEntry, writeJson, readJsonIfExists, logger, isMain,
} from './lib.mjs';

const SITE = 'https://eemis.mglsd.go.ug';
const LIST_URL = `${SITE}/companies`;
const AJAX = `${SITE}/ajax_calls/load_comp`;
const SOURCE = { name: 'EEMIS, Ministry of Gender, Labour and Social Development', url: LIST_URL, method: 'api' };
const log = logger('ug');
const DETAIL_DELAY_MS = 250;
const DETAIL_FETCH = { retries: 6, timeoutMs: 45000 };
const OUT_FILE = path.join(OUT_DIR, 'ug.json');
const AJAX_HEADERS = { 'X-Requested-With': 'XMLHttpRequest', Referer: LIST_URL };

async function loadAll() {
  const byId = new Map();
  let lid = 999999;
  for (let round = 0; round < 50; round++) {
    const { json, status } = await fetchJson(`${AJAX}?lid=${lid}&pp=1000&s=`, { headers: AJAX_HEADERS, log });
    if (!Array.isArray(json)) throw new Error(`load_comp returned non-array (HTTP ${status})`);
    if (!json.length) break;
    let added = 0;
    for (const c of json) if (!byId.has(c.id)) { byId.set(c.id, c); added++; }
    const minId = Math.min(...json.map((c) => Number(c.id)));
    log(`round ${round + 1}: ${json.length} rows, ${added} new, min id ${minId}`);
    if (!added || minId >= lid) break;
    lid = minId;
    await sleep(400);
  }
  return [...byId.values()];
}

function li(html, label) {
  const m = html.match(new RegExp(`<li><strong>\\s*${label}\\s*:?\\s*</strong>(?:</strong>)?([\\s\\S]*?)</li>`, 'i'));
  return m ? m[1] : null;
}

function parseDetail(html) {
  const block = (html.match(/<ul class="company-small">([\s\S]*?)<\/ul>/i) || [])[1] || '';
  const statusBadge = clean((html.match(/<div class="clearfix"><span class="label[^"]*">([^<]*)<\/span>/i) || [])[1] || '');
  return {
    license_no: clean(li(block, 'Licence No') || '') || null,
    start: clean(li(block, 'Start Date') || ''),
    expiry: clean(li(block, 'Expiry Date') || ''),
    address: stripTags(li(block, 'Address') || '').split('\n').map((s) => s.trim()).filter(Boolean).join(', ') || null,
    phone: clean(li(block, 'Phone') || '') || null,
    email: clean(li(block, 'Email') || '') || null,
    status_badge: statusBadge || null,
  };
}

function mapStatus(text) {
  const t = String(text || '').toUpperCase();
  if (t.includes('ACTIVE') && !t.includes('INACTIVE')) return 'active';
  if (t.includes('INACTIVE') || t.includes('SUSPEND')) return 'inactive';
  if (t.includes('EXPIRED')) return 'expired';
  if (t.includes('REVOKED') || t.includes('CANCEL')) return 'revoked';
  return 'unknown';
}

export async function run() {
  const notes = [];
  const list = await loadAll();
  log(`${list.length} companies from load_comp`);
  // previous snapshot, so a transient detail-page failure reuses last run's detail fields instead of dropping them
  const prevSnap = await readJsonIfExists(OUT_FILE);
  const prevById = new Map((prevSnap?.entries || []).map((e) => [String(e.raw?.eemis_id), e]));
  const entries = [];
  let detailFailures = 0;
  let reused = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    let d = null;
    try {
      const { text } = await fetchText(c.cm_url, { ...DETAIL_FETCH, log });
      d = parseDetail(text);
    } catch (e) {
      const prev = prevById.get(String(c.id));
      if (prev && prev.raw?.detail) {
        reused++;
        d = {
          license_no: prev.license_no, start: prev.raw.detail.start_date, expiry: prev.raw.detail.expiry_date,
          address: prev.address, phone: prev.phones[0] || null, email: prev.emails[0] || null, status_badge: prev.raw.detail.status_badge,
          reused_from: prevSnap.as_of,
        };
        notes.push(`detail fetch failed for ${c.title} (${c.cm_url}): ${e.message}; reused detail from ${prevSnap.as_of} snapshot`);
      } else {
        detailFailures++;
        notes.push(`detail fetch failed for ${c.title} (${c.cm_url}): ${e.message}`);
      }
    }
    await sleep(DETAIL_DELAY_MS);
    const listStatus = clean(c.status);
    const [dFrom, dTo] = String(c.dates || '').split(/\s+-\s+/);
    const valid_from = parseDate(d?.start) || parseDate(dFrom);
    const valid_to = parseDate(d?.expiry) || parseDate(dTo);
    entries.push(makeEntry('ug', entries.length + 1, 256, {
      name: c.title,
      status: mapStatus(d?.status_badge || listStatus),
      license_no: d?.license_no || null,
      emails: extractEmails(d?.email || ''),
      phones: [c.phone, d?.phone].filter(Boolean),
      website: null,
      address: d?.address || c.location || null,
      valid_from, valid_to,
      type: 'private',
      cac_verified: null,
      raw: {
        eemis_id: c.id, list_status: listStatus, list_location: c.location, list_dates: c.dates,
        detail_url: c.cm_url, logo: c.img || null,
        detail: d ? { start_date: d.start, expiry_date: d.expiry, status_badge: d.status_badge, ...(d.reused_from ? { reused_from: d.reused_from } : {}) } : null,
      },
    }));
    if ((i + 1) % 25 === 0) log(`details ${i + 1}/${list.length}`);
  }
  const statusCounts = {};
  for (const e of entries) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  const expiredByDate = entries.filter((e) => e.valid_to && e.valid_to < today()).length;
  notes.push(`status counts: ${JSON.stringify(statusCounts)}; ${expiredByDate} entries have a licence expiry date already in the past despite ACTIVE badge`);
  notes.push('EEMIS public listing only exposes ACTIVE companies; there is no public list of suspended or expired licences. Licence no, dates, address, phone and email come from each company detail page.');
  if (reused) notes.push(`${reused} detail pages failed this run; their detail fields were reused from the previous snapshot`);
  if (detailFailures) notes.push(`${detailFailures} detail pages failed with no previous data; those entries carry list-level data only`);
  const doc = { country: 'UG', source: SOURCE, as_of: today(), count: entries.length, entries };
  await writeJson(OUT_FILE, doc);
  log(`wrote ${entries.length} entries`);
  return { country: 'UG', source: SOURCE, as_of: doc.as_of, count: entries.length, method: SOURCE.method, notes };
}

if (isMain(import.meta.url)) run().catch((e) => { console.error(e); process.exit(1); });
