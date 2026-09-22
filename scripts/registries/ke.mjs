// Kenya: National Employment Authority register of private recruitment agencies.
// Sources are tried in order and the first one that yields entries wins:
//   (a) neaims.go.ke SPA + any /api/ endpoint referenced by its JS bundles
//   (b) diaspora.go.ke/verify, which loads a static agencies.json (State Department for Diaspora Affairs mirror of the NEA register)
//   (c) neaims.go.ke/EmploymentAgencyList.aspx
//   (d) NEA 2022 PDF (parsed with python pypdf)
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import {
  OUT_DIR, politeFetch, fetchText, fetchJson, today, clean, extractEmails, makeEntry, writeJson, logger, isMain, sleep,
} from './lib.mjs';

const log = logger('ke');
const NEAIMS = 'https://neaims.go.ke/';
const DIASPORA_VERIFY = 'https://diaspora.go.ke/verify';
const ASPX = 'https://neaims.go.ke/EmploymentAgencyList.aspx';
const PDF = 'https://nea.go.ke/web/wp-content/uploads/2022/06/Private-Recruitment-Agencies-Final-Version.pdf';
const SHORT = { retries: 1, timeoutMs: 20000, log };

function mapStatus(s) {
  const t = String(s || '').toLowerCase();
  if (/^valid|active|licen[cs]ed|current/.test(t)) return 'active';
  if (/expired|lapsed/.test(t)) return 'expired';
  if (/revoked|cancel|deregister/.test(t)) return 'revoked';
  if (/suspend|inactive/.test(t)) return 'inactive';
  return 'unknown';
}

/* (a) neaims SPA: fetch shell, follow script bundles, look for API paths, try them. */
async function tryNeaims(notes) {
  let html;
  try {
    const r = await fetchText(NEAIMS, SHORT);
    html = r.text;
    notes.push(`(a) neaims.go.ke root: HTTP ${r.status}, ${html.length} bytes`);
  } catch (e) {
    notes.push(`(a) neaims.go.ke root unreachable: ${e.message}`);
    return null;
  }
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => new URL(m[1], NEAIMS).href);
  const apiPaths = new Set();
  for (const src of scripts.slice(0, 12)) {
    try {
      const { text } = await fetchText(src, SHORT);
      for (const m of text.matchAll(/["'`]((?:https?:\/\/[^"'`\s]+)?\/api\/[A-Za-z0-9_\-./]+)["'`]/g)) apiPaths.add(m[1]);
    } catch (e) { notes.push(`(a) bundle ${src} failed: ${e.message}`); }
  }
  notes.push(`(a) ${scripts.length} script bundles scanned, ${apiPaths.size} /api/ paths found${apiPaths.size ? ': ' + [...apiPaths].slice(0, 10).join(', ') : ''}`);
  for (const p of apiPaths) {
    if (!/agenc/i.test(p)) continue;
    try {
      const url = new URL(p, NEAIMS).href;
      const { json, status } = await fetchJson(url, SHORT);
      const arr = Array.isArray(json) ? json : json?.data || json?.result || json?.items;
      if (Array.isArray(arr) && arr.length) {
        notes.push(`(a) ${url} returned ${arr.length} rows (HTTP ${status})`);
        return { method: 'api', url, as_of: today(), rows: arr.map((r) => ({
          name: r.name || r.agencyName || r.AgencyName || r.Name, license_no: r.registrationNo || r.regNo || r.licenseNo || null,
          emails: extractEmails(JSON.stringify(r)), status: mapStatus(r.status || r.Status), website: r.website || null, phones: [r.phone, r.telephone].filter(Boolean), raw: r,
        })) };
      }
      notes.push(`(a) ${url}: HTTP ${status}, no array payload`);
    } catch (e) { notes.push(`(a) ${p}: ${e.message}`); }
  }
  return null;
}

/* (b) diaspora.go.ke/verify -> agencies.json */
async function tryDiaspora(notes) {
  let jsonUrl = new URL('agencies.json', DIASPORA_VERIFY).href;
  try {
    const { text, status } = await fetchText(DIASPORA_VERIFY, { log });
    const m = text.match(/fetch\(\s*['"]([^'"]+\.json)['"]/);
    if (m) jsonUrl = new URL(m[1], DIASPORA_VERIFY).href;
    notes.push(`(b) diaspora.go.ke/verify: HTTP ${status}; register endpoint in page source: ${jsonUrl}`);
  } catch (e) {
    notes.push(`(b) diaspora.go.ke/verify page failed: ${e.message}; trying ${jsonUrl} directly`);
  }
  try {
    const res = await politeFetch(jsonUrl, { headers: { Accept: 'application/json' }, log });
    const lastMod = res.headers.get('last-modified');
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) { notes.push(`(b) ${jsonUrl}: HTTP ${res.status} but no array`); return null; }
    const asOf = lastMod && !Number.isNaN(Date.parse(lastMod)) ? new Date(lastMod).toISOString().slice(0, 10) : today();
    notes.push(`(b) ${jsonUrl}: HTTP ${res.status}, ${data.length} rows, Last-Modified ${lastMod || 'n/a'}`);
    return {
      method: 'api', url: jsonUrl, as_of: asOf, last_modified: lastMod,
      rows: data.map((r) => ({
        name: r['Agency Name'], license_no: clean(r['NEA Reg No'] || '') || null, emails: extractEmails(r['E-mail Address'] || ''),
        website: r['Website'], status: mapStatus(r['Status']), phones: [], raw: r,
      })),
    };
  } catch (e) { notes.push(`(b) ${jsonUrl} failed: ${e.message}`); return null; }
}

/* (c) legacy aspx list */
async function tryAspx(notes) {
  try {
    const { text, status } = await fetchText(ASPX, SHORT);
    const rows = [];
    const table = text.match(/<table[\s\S]*?<\/table>/i);
    if (table) {
      for (const tr of table[0].split(/<tr[^>]*>/i).slice(2)) {
        const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => clean(m[1]));
        if (tds.length >= 2 && tds[1]) rows.push({ name: tds[1], license_no: tds[0] || null, emails: extractEmails(tds.join(' ')), status: 'unknown', raw: { cells: tds } });
      }
    }
    notes.push(`(c) ${ASPX}: HTTP ${status}, ${rows.length} rows parsed`);
    return rows.length ? { method: 'html-pagination', url: ASPX, as_of: today(), rows } : null;
  } catch (e) { notes.push(`(c) ${ASPX} unreachable: ${e.message}`); return null; }
}

/* (d) 2022 PDF via python pypdf */
async function tryPdf(notes) {
  let buf;
  try {
    const res = await politeFetch(PDF, { log });
    buf = Buffer.from(await res.arrayBuffer());
    notes.push(`(d) PDF: HTTP ${res.status}, ${buf.length} bytes`);
  } catch (e) { notes.push(`(d) PDF download failed: ${e.message}`); return null; }
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ke-nea-'));
  const pdfPath = path.join(dir, 'nea.pdf');
  await writeFile(pdfPath, buf);
  const py = [
    'import sys, json',
    'from pypdf import PdfReader',
    'r = PdfReader(sys.argv[1])',
    'print(json.dumps([p.extract_text() or "" for p in r.pages]))',
  ].join('\n');
  const out = spawnSync('python', ['-c', py, pdfPath], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, maxBuffer: 64 * 1024 * 1024 });
  await rm(dir, { recursive: true, force: true });
  if (out.status !== 0) { notes.push(`(d) pypdf failed: ${(out.stderr || '').trim().slice(0, 300)}`); return null; }
  const pages = JSON.parse(out.stdout);
  const rows = [];
  // Expected line shape: "<n> <AGENCY NAME> <NEA reg no or email> ..." varies; keep the lines that contain a recognisable name + optional email.
  for (const page of pages) {
    for (const line of page.split('\n')) {
      const m = line.match(/^\s*(\d{1,4})[.)]?\s+(.+?)\s*$/);
      if (!m) continue;
      const rest = m[2];
      const emails = extractEmails(rest);
      const name = clean(rest.replace(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi, '').replace(/\b(www\.)?[a-z0-9-]+\.(com|co\.ke|org|net|ke)\b/gi, '').replace(/\+?\d[\d\s\-]{6,}\d/g, ''));
      if (name.length < 3) continue;
      rows.push({ name, emails, status: 'unknown', raw: { line: line.trim(), sn: m[1] } });
    }
  }
  notes.push(`(d) pypdf extracted ${pages.length} pages, ${rows.length} candidate rows`);
  return rows.length ? { method: 'pdf', url: PDF, as_of: '2022-06-01', rows } : null;
}

export async function run() {
  const notes = [];
  let picked = null;
  let sourceName = 'National Employment Authority (NEA), Kenya';
  for (const [label, fn] of [['a', tryNeaims], ['b', tryDiaspora], ['c', tryAspx], ['d', tryPdf]]) {
    const r = await fn(notes);
    if (r && r.rows.length) { picked = { ...r, label }; break; }
    await sleep(300);
  }
  if (!picked) throw new Error(`Kenya: no source worked. ${notes.join(' | ')}`);
  if (picked.label === 'b') sourceName = 'NEA register of private recruitment agencies, via State Department for Diaspora Affairs (diaspora.go.ke)';
  if (picked.label === 'd') { sourceName = 'NEA Private Recruitment Agencies list (PDF, June 2022)'; notes.push('CAVEAT: only the 2022 PDF worked; as_of is the document date, not a live registry.'); }
  const source = { name: sourceName, url: picked.url, method: picked.method };
  const seen = new Set();
  const entries = [];
  for (const r of picked.rows) {
    if (!r.name) continue;
    const key = `${String(r.name).toLowerCase().trim()}|${r.license_no || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(makeEntry('ke', entries.length + 1, 254, {
      name: r.name, status: r.status, license_no: r.license_no || null, emails: r.emails || [], phones: r.phones || [],
      website: r.website || null, address: r.address || null, valid_from: null, valid_to: null, type: 'private', cac_verified: null, raw: r.raw || {},
    }));
  }
  const dupes = picked.rows.length - entries.length;
  if (dupes) notes.push(`${dupes} duplicate rows dropped`);
  const statusCounts = {};
  for (const e of entries) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  notes.push(`worked: option (${picked.label}) ${picked.method} ${picked.url}; status counts: ${JSON.stringify(statusCounts)}`);
  if (picked.label === 'b') notes.push('Register carries NEA reg no, email, website, service type and Valid/Expired status only; no phones, addresses or licence dates. as_of is the Last-Modified date of agencies.json.');
  const doc = { country: 'KE', source, as_of: picked.as_of, count: entries.length, entries };
  await writeJson(path.join(OUT_DIR, 'ke.json'), doc);
  log(`wrote ${entries.length} entries via option (${picked.label})`);
  return { country: 'KE', source, as_of: picked.as_of, count: entries.length, method: picked.method, notes };
}

if (isMain(import.meta.url)) run().catch((e) => { console.error(e); process.exit(1); });
