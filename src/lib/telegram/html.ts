import type { Report, VerdictLevel } from "@/lib/check/types";
import type { NameHit } from "@/lib/registry/load";
import { COUNTRIES, COUNTRY_CODES, type Country } from "@/lib/countries";
import { REPLY_LANGS } from "@/lib/check/replies";
import { getHotlines } from "@/lib/law";
import { SAMPLES } from "@/lib/samples";
import { BRAND } from "@/lib/brand";
import type { Keyboard } from "./api";

// HTML messages and inline keyboards for the Telegram bot. The engine decides; this file only lays it out.
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STAMP: Record<VerdictLevel, string> = { stop: "🛑 STOP", caution: "⚠️ CAUTION", on_file: "📋 ON FILE", unknown: "🔎 NOT ON FILE" };
const CONTACT: Record<string, string> = { match: "✅ matches the register", mismatch: "✗ not the contact on file", none_on_file: "register publishes no contact", not_provided: "no contact in the message" };
const SEV: Record<string, string> = { high: "🔴", medium: "🟠", low: "🟡", info: "⚪" };

export function cardUrl(siteUrl: string, id: string): string {
  return `${siteUrl}/c/${id}`;
}

export function shareUrl(r: Report, siteUrl: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(cardUrl(siteUrl, r.id))}&text=${encodeURIComponent(r.actions.shareText.replace(/ Full card: \S+$/, ""))}`;
}

export function cardHtml(r: Report): string {
  const c = COUNTRIES[r.country];
  const out: string[] = [`<b>${STAMP[r.verdict.level]}</b>  ·  ${c.flag} ${esc(c.name)}`, `<b>${esc(r.verdict.headline)}</b>`];

  const lines = r.verdict.lines.filter((l) => l.trim() && l.trim() !== r.verdict.headline.trim());
  if (lines.length) out.push("", ...lines.map(esc));

  if (r.verifiedSender) {
    out.push("", `✅ <b>Verified sender</b>: ${esc(r.verifiedSender.company)} proved control of <code>${esc(r.verifiedSender.domain)}</code> on ${r.verifiedSender.verifiedAt.slice(0, 10)}.`);
  }

  const top = r.identity.matches[0];
  if (top) {
    const reg = COUNTRIES[top.country].registry.short;
    const valid = top.validTo ? ` to ${top.validTo}` : "";
    out.push("", `<b>On the ${esc(reg)} register</b>`, `${esc(top.name)} · ${top.status}${valid}${top.licenseNo ? ` · <code>${esc(top.licenseNo)}</code>` : ""}`);
    const onFile = [...top.onFile.phones, ...top.onFile.emails].slice(0, 2);
    if (onFile.length) out.push(`On file: <code>${onFile.map(esc).join("</code>, <code>")}</code>`);
    const given = [...r.extraction.phones, ...r.extraction.emails].slice(0, 2);
    if (given.length) out.push(`In the message: <code>${given.map(esc).join("</code>, <code>")}</code>`);
    out.push(`${CONTACT[top.contact] ?? top.contact}${r.identity.impersonation ? " · <b>looks like impersonation</b>" : ""}`);
  }

  const dom = r.domains[0];
  if (dom && !dom.freeMail && (dom.ageDays !== null || dom.site)) {
    const bits: string[] = [];
    if (dom.ageDays !== null) bits.push(dom.ageDays < 365 ? `${dom.ageDays} days old` : `${Math.floor(dom.ageDays / 365)} years old`);
    if (dom.site) bits.push(dom.site.parked ? "website parked" : dom.site.reachable ? `website live${dom.site.mentionsName ? ", names the company" : ""}` : "website unreachable");
    if (dom.lookalikeOf) bits.push(`looks like ${dom.lookalikeOf.domain}`);
    out.push("", `<b>Domain</b> <code>${esc(dom.domain)}</code>: ${bits.join(" · ")}`);
  }

  if (r.lure.length) {
    out.push("", "<b>Warnings</b>");
    for (const f of r.lure.slice(0, 5)) out.push(`${SEV[f.severity] ?? "•"} ${esc(f.title)}${f.evidence ? ` <i>(${esc(f.evidence.slice(0, 70))})</i>` : ""}`);
    if (r.lure.length > 5) out.push(`<i>and ${r.lure.length - 5} more on the card</i>`);
  }

  if (r.clauses.length) {
    out.push("", "<b>Offer clauses</b>");
    for (const cl of r.clauses.slice(0, 4)) out.push(`${SEV[cl.severity] ?? "•"} ${esc(cl.label)}${cl.citation ? ` <i>(${esc(cl.citation.act)}${cl.citation.section && cl.citation.section !== "judgment" ? `, ${esc(cl.citation.section)}` : ""})</i>` : ""}`);
  }

  if (r.community?.reports) out.push("", `🚩 Reported by ${r.community.reports} ${r.community.reports === 1 ? "person" : "people"} before you.`);

  const asOf = COUNTRY_CODES.map((cc) => `${COUNTRIES[cc].registry.short} ${r.registryAsOf[cc]}`).join(" · ");
  out.push("", `<i>Registers: ${esc(asOf)}</i>`, `<i>${esc(BRAND.name)} never says an offer is "safe".</i>`);
  return out.join("\n");
}

export function cardKeyboard(r: Report, siteUrl: string, llm: boolean): Keyboard {
  const rows: Keyboard = [
    [
      { text: "📄 Full card", url: cardUrl(siteUrl, r.id) },
      { text: "📤 Share to a group", url: shareUrl(r, siteUrl) },
    ],
    [
      { text: "✉️ Reply in English", callback_data: `rp:en:${r.id}` },
      { text: "🗣 Reply in Pidgin", callback_data: `rp:pcm:${r.id}` },
    ],
  ];
  if (llm) rows.push([{ text: "🌍 Igbo, Yoruba, Hausa, Swahili, Luganda, Twi", callback_data: `langs:${r.id}` }]);
  const reportable = r.extraction.phones.length + r.extraction.emails.length > 0;
  const row: InlineRow = [];
  if (reportable) row.push({ text: "🚩 Report this contact", callback_data: `rep:${r.id}` });
  row.push({ text: "☎️ Hotline", callback_data: `hot:${r.country}` });
  rows.push(row);
  const q = r.identity.queries[0]?.trim();
  if (q) rows.push([{ text: `🔎 "${q.slice(0, 28).trim()}" in the registers`, url: `${siteUrl}/registry?q=${encodeURIComponent(q)}` }]);
  return rows;
}
type InlineRow = Keyboard[number];

export function replyHtml(r: Report, lang: string, text: string): { html: string; keyboard: Keyboard } {
  const l = REPLY_LANGS.find((x) => x.code === lang);
  const phone = r.extraction.phones[0]?.replace(/\D/g, "");
  const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  return {
    html: [`<b>Reply in ${esc(l?.native ?? lang)}</b>  <i>tap the text to copy</i>`, "", `<code>${esc(text)}</code>`].join("\n"),
    keyboard: [[{ text: phone ? "💬 Send on WhatsApp to that number" : "💬 Open in WhatsApp", url: wa }]],
  };
}

export function langsKeyboard(id: string): Keyboard {
  const llm = REPLY_LANGS.filter((l) => l.llm);
  const rows: Keyboard = [];
  for (let i = 0; i < llm.length; i += 3) rows.push(llm.slice(i, i + 3).map((l) => ({ text: l.native, callback_data: `rp:${l.code}:${id}` })));
  return rows;
}

export function hotlinesHtml(country: Country): string {
  const c = COUNTRIES[country];
  const list = getHotlines(country);
  const out = [`<b>☎️ Who to call in ${c.flag} ${esc(c.name)}</b>`, ""];
  if (!list.length) out.push("No verified hotline on file yet.");
  for (const h of list) {
    const v = h.channel === "web" ? `<a href="${esc(h.value)}">${esc(h.value.replace(/^https?:\/\//, ""))}</a>` : `<code>${esc(h.value)}</code>`;
    out.push(`• <b><a href="${esc(h.source_url)}">${esc(h.org)}</a></b>: ${v}`);
  }
  out.push("", `<i>Each name links to the official page the number was taken from.</i>`);
  return out.join("\n");
}

export function countryKeyboard(prefix: string): Keyboard {
  return [COUNTRY_CODES.map((cc) => ({ text: `${COUNTRIES[cc].flag} ${COUNTRIES[cc].name}`, callback_data: `${prefix}:${cc}` }))];
}

export function registryHtml(q: string, hits: NameHit[]): { html: string; keyboard: Keyboard } {
  if (!hits.length) return { html: `Nothing on file for <b>${esc(q)}</b> in the four registers. Try fewer words, or the exact name in the message.`, keyboard: [] };
  const out = [`<b>🔎 Closest entries for "${esc(q)}"</b>`, "<i>Similar names are shown on purpose: impersonators change one word.</i>", ""];
  for (const h of hits) {
    const c = COUNTRIES[h.country];
    const contact = [...h.entry.phones, ...h.entry.emails].slice(0, 1).map(esc).join("");
    out.push(`${c.flag} <b>${esc(h.entry.name)}</b> · ${h.entry.status}${h.entry.valid_to ? ` to ${h.entry.valid_to}` : ""} · ${Math.round(h.score * 100)}%${contact ? `\n    <code>${contact}</code>` : ""}`);
  }
  return { html: out.join("\n"), keyboard: [] };
}

// The persistent keyboard under the text box. Labels double as commands when the user taps them.
export const MENU = {
  check: "📋 Check a message",
  examples: "▶ Examples",
  registry: "🔎 Search registers",
  hotlines: "☎️ Hotlines",
  help: "ℹ️ Help",
} as const;

export function mainMenu(): string[][] {
  return [
    [MENU.check, MENU.examples],
    [MENU.registry, MENU.hotlines],
    [MENU.help],
  ];
}

export const DISMISS: InlineRow = [{ text: "✕ Dismiss", callback_data: "del" }];

export function withDismiss(keyboard: Keyboard = []): Keyboard {
  return [...keyboard, DISMISS];
}

export const PROMPTS = {
  check: "Paste or forward the job message now. Include the number and email exactly as they appear.",
  registry: "Which agency or company? Type the name as it appears in the message.",
} as const;

export function startHtml(): string {
  return [
    `<b>${esc(BRAND.display)}</b>  ·  <i>Yoruba: to be sure, to be certain</i>`,
    "",
    "Forward me a job ad, a recruiter's message or an offer letter. I check the name, number and email against the licensed-agency registers of 🇳🇬 Nigeria, 🇰🇪 Kenya, 🇺🇬 Uganda and 🇬🇭 Ghana, apply the official warning patterns, and hand you the reply to send.",
    "",
    `Paste a message any time, or use the buttons below. <b>${esc(MENU.examples)}</b> runs a real case.`,
  ].join("\n");
}

export function examplesKeyboard(): Keyboard {
  return withDismiss(SAMPLES.filter((s) => ["uganda-gulf", "thailand", "lagos-offer", "kenya-expired", "direct-employer"].includes(s.id)).map((s) => [{ text: `▶ ${s.label}`, callback_data: `sample:${s.id}` }]));
}

export function helpHtml(siteUrl: string): { html: string; keyboard: Keyboard } {
  return {
    html: [
      "<b>How to use me</b>",
      "",
      "• Forward or paste any job message. I answer with a stamp: <b>Stop</b>, <b>Caution</b>, <b>On file</b> or <b>Not on file</b>. Never \"safe\".",
      "• /registry <i>name</i> looks a company or agency up in all four registers.",
      "• /hotlines shows who to call in your country.",
      "• Every answer has buttons: the full card, a reply you can send, a share link, and a way to report the contact.",
      "",
      "Screenshots: open the website and drop the image there; it is read on your phone and never uploaded.",
    ].join("\n"),
    keyboard: [[{ text: "🖼 Check a screenshot on the website", url: `${siteUrl}/check` }]],
  };
}

export function busyHtml(): string {
  return "🔍 Reading the message and searching four registers…";
}
