import type { Country } from "@/lib/countries";
import { COUNTRIES, COUNTRY_CODES } from "@/lib/countries";
import { domainOf, normPhone, countryFromPhone } from "@/lib/registry/match";
import type { Extraction, InputKind, MoneyMention } from "@/lib/check/types";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:(?:com|co|org|net|ac|gov|edu)\.(?:uk|ng|ke|ug|gh|za|tz|rw|zm|au|in|nz)|com|net|org|co|io|ng|ke|ug|gh|africa|info|biz|xyz|site|online|work|jobs|careers|agency|ltd|top|click|link|me|app|ai)(?![a-z])(?:\/[^\s<>"')\]]*)?/gi;
const PHONE_RE = /(?:\+|00)?\d[\d\s().-]{7,16}\d/g;
const MONEY_RE = /(₦|NGN|N|KSh|Ksh|KES|Sh|USh|UGX|GH₵|GHS|GHC|GH¢|\$|USD|£|GBP|€|EUR|AED|SAR|QAR|RUB)\s?([\d,]+(?:\.\d+)?)\s?(k|m|million|thousand)?(?![a-z])|([\d,]+(?:\.\d+)?)\s?(k|m|million|thousand)?(?![a-z])\s?(naira|shillings?|cedis|dollars?|usd|pounds?|euros?|dirhams?|riyals?|rubles?)/gi;

const FEE_WORDS = /(registration|processing|application|training|medical|visa|ticket|flight|form|verification|deposit|insurance|uniform|logistics|onboarding|kit|refundable|non[- ]?refundable|commitment|clearance|documentation|admin(?:istrative)?|agency|placement|police report|police clearance|courier|delivery|access|activation|membership|subscription|id card|laptop|equipment|tax|customs|bond|security|guarantee) (?:fee|charge|payment|cost|levy)|(?:fee|charge|payment)s? (?:of|for) (?:registration|processing|training|medical|visa|ticket|form|verification|insurance|uniform|logistics|onboarding|documentation|placement)|pay (?:a |an |the |only |just )?(?:sum|amount|fee|token|small)|(?:make|send|transfer) (?:a |the )?(?:payment|deposit|transfer)|(?:refundable|non[- ]?refundable) (?:deposit|caution|fee)/i;

const DESTINATIONS: [RegExp, string][] = [
  [/\bthailand|bangkok|mae ?sot|phuket|pattaya\b/i, "Thailand"],
  [/\bmyanmar|burma|myawaddy|kk ?park|shwe ?kokko\b/i, "Myanmar"],
  [/\bcambodia|phnom ?penh|sihanoukville|poipet\b/i, "Cambodia"],
  [/\blaos|golden ?triangle\b/i, "Laos"],
  [/\brussia|moscow|tatarstan|alabuga|yelabuga|kazan\b/i, "Russia"],
  [/\bdubai|uae|united arab emirates|abu dhabi|sharjah\b/i, "UAE"],
  [/\bqatar|doha\b/i, "Qatar"],
  [/\bsaudi|riyadh|jeddah|ksa\b/i, "Saudi Arabia"],
  [/\bkuwait\b/i, "Kuwait"],
  [/\boman|muscat\b/i, "Oman"],
  [/\bbahrain\b/i, "Bahrain"],
  [/\blebanon|beirut\b/i, "Lebanon"],
  [/\bjordan|amman\b/i, "Jordan"],
  [/\bmalaysia|kuala ?lumpur\b/i, "Malaysia"],
  [/\bsingapore\b/i, "Singapore"],
  [/\bchina|guangzhou|shenzhen\b/i, "China"],
  [/\bcanada|toronto|vancouver\b/i, "Canada"],
  [/\b(?:the )?uk\b|united kingdom|london|manchester|england/i, "United Kingdom"],
  [/\busa\b|united states|america|new york|texas|houston/i, "United States"],
  [/\bpoland|warsaw\b/i, "Poland"],
  [/\bgermany|berlin\b/i, "Germany"],
  [/\bcyprus\b/i, "Cyprus"],
  [/\bserbia|belgrade\b/i, "Serbia"],
  [/\bturkey|istanbul\b/i, "Turkey"],
  [/\bcote d'?ivoire|ivory coast|abidjan\b/i, "Côte d'Ivoire"],
  [/\bsouth africa|johannesburg|cape town\b/i, "South Africa"],
  [/\bghana|accra|kumasi\b/i, "Ghana"],
  [/\bnigeria|lagos|abuja\b/i, "Nigeria"],
  [/\bkenya|nairobi|mombasa\b/i, "Kenya"],
  [/\buganda|kampala|entebbe\b/i, "Uganda"],
];

const TITLES: [RegExp, string][] = [
  [/customer (?:care|service|support|success)(?: rep(?:resentative)?| agent| officer| executive)?/i, "Customer service"],
  [/(?:live )?chat (?:support|agent|operator)/i, "Chat support"],
  [/data entry|typist|typing job/i, "Data entry"],
  [/translator|interpreter/i, "Translator"],
  [/digital marketing|social media manager|online marketing/i, "Digital marketing"],
  [/crypto(?:currency)? (?:trader|trading|analyst)|forex/i, "Crypto trading"],
  [/it support|computer technician|network (?:engineer|technician)|software (?:developer|engineer)|web developer|programmer/i, "IT"],
  [/telecom|call cent(?:er|re)|telemarket/i, "Call centre"],
  [/(?:online )?gaming|casino|betting/i, "Gaming"],
  [/housemaid|domestic worker|house help|nanny|caregiver|cleaner|driver|security guard|factory worker|warehouse|packer|farm worker|fruit picker|construction/i, "Manual or domestic work"],
  [/nurse|caregiver|healthcare assistant/i, "Healthcare"],
  [/teacher|tutor|lecturer/i, "Teaching"],
  [/accountant|auditor|book ?keeper/i, "Accounting"],
  [/air ?hostess|cabin crew|flight attendant/i, "Cabin crew"],
  [/office (?:admin|assistant|administrator)|personal assistant|receptionist|secretary/i, "Office admin"],
  [/sales (?:rep|representative|executive|agent)|marketer|business development/i, "Sales"],
];

const ORG_SUFFIX = "(?:Ltd\\.?|Limited|LTD|Plc|PLC|Agency|Agencies|Recruitment|Recruiters|Recruiting|Consult(?:ing|ants|ancy)?|Services|Solutions|International|Global|Group|Nig(?:eria)?|Enterprises?|Company|Co\\.?|Inc\\.?|LLC|HR|Resources|Manpower|Staffing|Travels?|Tours?|Ventures|Holdings|Partners|Associates|Logistics|Technologies|Tech|Systems|Concepts|Foundation|Institute|Academy|Bank|Oil|Gas|Energy|Petroleum|Airlines?|Hospital|Clinic|Hotels?|Realty|Estates?|Investments?|Capital|Finance|Bureau|Centre|Center|Network|Network|Industries|Corporation|Corp\\.?)";
// Neighbourhoods and cities that ads write as "Location: Chevron, Lekki" and the org regexes mistake for a company.
const PLACE_WORDS = new Set(
  `lagos abuja fct ikeja ikoyi lekki ajah chevron sangotedo ibeju epe badagry yaba surulere victoria island vi ikorodu ojota maryland gbagada magodo agege apapa festac oshodi ogba berger mushin ilupeju ojodu ogudu alimosho egbeda ajao isolo ikotun ipaja ojo okota orile ketu mile
  port harcourt ibadan kano enugu kaduna benin warri uyo calabar owerri asaba onitsha aba jos ilorin abeokuta akure osogbo minna makurdi lokoja awka umuahia abakaliki yenagoa nnewi
  nairobi mombasa kisumu nakuru eldoret westlands kilimani kileleshwa karen thika ruaka kasarani embakasi upper hill parklands cbd lavington runda ruiru kitengela rongai syokimau utawala
  kampala entebbe kololo ntinda nakawa bugolobi naalya kira wakiso mukono jinja gulu mbarara najjera kansanga muyenga bukoto makerere kawempe nansana lubowa
  accra kumasi tema takoradi east legon osu airport spintex madina adenta dansoman labone cantonments achimota kasoa tamale cape coast dzorwulu roman ridge
  nigeria kenya uganda ghana state phase estate road street avenue close junction area zone extension district town city region`.split(/\s+/),
);
const ORG_SUFFIX_RE = new RegExp(`^${ORG_SUFFIX}$`, "i");

// True when a candidate is only place names and filler, for example "Chevron Lekki" or "Lekki Phase 1".
function isPlaceOnly(cand: string): boolean {
  const words = cand.split(/[\s,]+/).filter(Boolean);
  if (words.some((w) => ORG_SUFFIX_RE.test(w))) return false;
  return words.every((w) => PLACE_WORDS.has(w.toLowerCase()) || /^\d+$/.test(w) || /^(?:of|and|&|de|for)$/i.test(w));
}

const ORG_RE = new RegExp(`\\b((?:[A-Z][\\w&'.-]*|of|and|&|de|for)(?:\\s+(?:[A-Z][\\w&'.-]*|of|and|&|de|for)){0,5}\\s+${ORG_SUFFIX})\\b`, "g");
const ORG_CUE_RE = /(?:from|at|with|by|for|represent(?:ing|s)?|on behalf of|hiring for|company(?: name)?[:\s]|agency[:\s]|employer[:\s]|organi[sz]ation[:\s]|firm[:\s])\s+([A-Z][\w&'-]*(?:\.[\w&'-]+)*(?:\s+(?:[A-Z][\w&'-]*(?:\.[\w&'-]+)*|of|and|&)){0,4})/g;
const PERSON_RE = /(?:my name is|this is|i am|i'm|regards,?)\s+((?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Engr\.?|Pastor|Alhaji|Chief)?\s?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?![\w.@-])/g;

const STOP_ORG = new Set(["The Company", "Our Company", "Your Company", "Human Resources", "Customer Service", "Job Alert", "Job Vacancy", "Whatsapp Group", "Dear Applicant", "Terms And Conditions"]);

// Department names and job words that a job description capitalises; on their own they name no company.
const GENERIC_ORG_WORDS = new Set(
  "creative strategy account management media agency digital marketing finance sales operations admin administration hr legal compliance product design engineering technology it data analytics research development business team teams department unit division group services service solutions consulting company limited ltd plc international global nigeria kenya uganda ghana lagos nairobi kampala accra manager lead head officer executive director assistant intern brand brands clients client industry industries".split(" "),
);
const PRODUCTS = new Set(["meta ads manager", "google ads", "google analytics", "google marketing platform", "tiktok ads manager", "looker studio", "power bi", "microsoft excel", "google sheets", "meta blueprint", "linkedin", "facebook", "instagram", "tiktok", "whatsapp", "telegram", "microsoft office", "google workspace", "zoom", "slack", "hubspot", "salesforce"]);
function isGenericOrg(cand: string): boolean {
  const words = cand.toLowerCase().split(/[\s,&]+/).filter(Boolean);
  return words.every((w) => GENERIC_ORG_WORDS.has(w) || /^(?:of|and|the|for)$/.test(w));
}

export function classifyKind(text: string, hasUrlOnly: boolean): InputKind {
  if (hasUrlOnly) return "link";
  const t = text.toLowerCase();
  if (/offer of employment|letter of (?:appointment|offer|employment|engagement)|we are pleased to offer|pleased to offer you|terms (?:and|&) conditions of (?:your )?employment|contract of employment|employment (?:contract|agreement)|your appointment as|probation(?:ary)? period|your (?:gross|net|monthly|annual) (?:salary|remuneration)|shall be entitled to|hereby (?:offer|appoint)/.test(t)) return "offer_letter";
  if (t.replace(/\s/g, "").length < 40 && (EMAIL_RE.test(text) || PHONE_RE.test(text))) return "contact_only";
  if (/vacanc|hiring|we are recruiting|apply now|job (?:opening|opportunity|alert|title|description)|position|requirements?|qualification|salary|per month|monthly|recruit|urgently needed|wanted|openings?|interested candidates|send (?:your )?cv/.test(t)) return "job_ad";
  return "recruiter_message";
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function parseAmount(num: string, mult?: string | null): number {
  let n = parseFloat(num.replace(/,/g, ""));
  if (!isFinite(n)) return 0;
  const m = (mult ?? "").toLowerCase();
  if (m === "k" || m === "thousand") n *= 1000;
  if (m === "m" || m === "million") n *= 1_000_000;
  return n;
}

function currencyCode(sym: string): string {
  const s = sym.toLowerCase();
  if (["₦", "ngn", "n", "naira"].includes(s)) return "NGN";
  if (["ksh", "kes", "sh", "shilling", "shillings"].includes(s)) return "KES";
  if (["ush", "ugx"].includes(s)) return "UGX";
  if (["gh₵", "ghs", "ghc", "gh¢", "cedi", "cedis"].includes(s)) return "GHS";
  if (["$", "usd", "dollar", "dollars"].includes(s)) return "USD";
  if (["£", "gbp", "pound", "pounds"].includes(s)) return "GBP";
  if (["€", "eur", "euro", "euros"].includes(s)) return "EUR";
  if (["aed", "dirham", "dirhams"].includes(s)) return "AED";
  if (["sar", "riyal", "riyals"].includes(s)) return "SAR";
  if (["qar"].includes(s)) return "QAR";
  if (["rub", "ruble", "rubles"].includes(s)) return "RUB";
  return sym.toUpperCase();
}

export function extractMoney(text: string): MoneyMention[] {
  const out: MoneyMention[] = [];
  let m: RegExpExecArray | null;
  MONEY_RE.lastIndex = 0;
  while ((m = MONEY_RE.exec(text))) {
    const sym = m[1] ?? m[6];
    const num = m[2] ?? m[4];
    const mult = m[3] ?? m[5];
    if (!sym || !num) continue;
    // A bare "N" followed by digits is only naira when it is a standalone symbol.
    if (m[1] === "N" && !/\bN\s?[\d,]/.test(m[0])) continue;
    const amount = parseAmount(num, mult);
    if (amount < 50) continue;
    const start = Math.max(0, m.index - 90);
    const context = text.slice(start, Math.min(text.length, m.index + m[0].length + 90)).replace(/\s+/g, " ");
    const feeMatch = context.match(FEE_WORDS);
    const isSalary = /salary|per month|monthly|per annum|annual|pay(?:ment)?s? (?:is|of)|earn|remuneration|wage|allowance|stipend|income|weekly/i.test(context) && !feeMatch;
    out.push({ amount, currency: currencyCode(sym), raw: m[0].trim(), context, purpose: feeMatch ? feeMatch[0].toLowerCase() : isSalary ? "salary" : null });
  }
  return out;
}

export function guessCountry(text: string, phones: string[], domains: string[]): Country | null {
  const t = text.toLowerCase();
  const score: Record<Country, number> = { NG: 0, KE: 0, UG: 0, GH: 0 };
  for (const p of phones) {
    const c = countryFromPhone(p);
    if (c) score[c] += 3;
  }
  for (const d of domains) for (const c of COUNTRY_CODES) if (d.endsWith(COUNTRIES[c].tld)) score[c] += 2;
  for (const c of COUNTRY_CODES) {
    for (const city of COUNTRIES[c].cities) if (t.includes(city)) score[c] += 1.5;
    if (t.includes(COUNTRIES[c].name.toLowerCase())) score[c] += 1.5;
    if (t.includes(COUNTRIES[c].demonym.toLowerCase())) score[c] += 1;
  }
  if (/₦|\bngn\b|naira/i.test(text)) score.NG += 2;
  if (/\bksh?s?\b|\bkes\b/i.test(text)) score.KE += 2;
  if (/\bugx\b|\bush\b/i.test(text)) score.UG += 2;
  if (/gh₵|gh¢|\bghs\b|\bghc\b|cedi/i.test(text)) score.GH += 2;
  if (/\bbvn\b|\bnin\b|nysc|jamb|waec|neco/i.test(text)) score.NG += 1.5;
  if (/\bkra\b|\bhuduma\b|\bkcse\b|m-?pesa|\bmpesa\b/i.test(text)) score.KE += 1.5;
  if (/\bursb\b|\bnira\b|\buce\b|\buace\b/i.test(text)) score.UG += 1.5;
  if (/ghana card|\bwassce\b|momo\b|mobile money/i.test(text)) score.GH += 1;
  const best = (Object.entries(score) as [Country, number][]).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

export function extractHeuristic(text: string, opts: { hint?: Country | null; hasUrlOnly?: boolean } = {}): Extraction {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const emails = uniq((clean.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()));
  const urls = uniq((clean.match(URL_RE) ?? []).map((u) => u.replace(/[.,;:]+$/, "")).filter((u) => !emails.some((e) => e.endsWith(u.toLowerCase()))));
  const phoneRaw = clean.match(PHONE_RE) ?? [];
  const phones = uniq(
    phoneRaw
      .map((p) => p.trim())
      .filter((p) => p.replace(/\D/g, "").length >= 9 && p.replace(/\D/g, "").length <= 15)
      .filter((p) => !/\d{4}[-/]\d{2}[-/]\d{2}/.test(p))
      .map((p) => normPhone(p, opts.hint ?? null))
      .filter((p) => p.replace(/\D/g, "").length >= 9),
  );
  const domains = uniq([...emails.map(domainOf), ...urls.map(domainOf)].filter((d): d is string => !!d && d.includes(".")));

  const orgs: string[] = [];
  let m: RegExpExecArray | null;
  ORG_RE.lastIndex = 0;
  while ((m = ORG_RE.exec(clean))) orgs.push(m[1].trim());
  ORG_CUE_RE.lastIndex = 0;
  while ((m = ORG_CUE_RE.exec(clean))) {
    const cand = m[1].trim();
    if (cand.split(/\s+/).length >= 2 || cand.length >= 6) orgs.push(cand);
  }
  const people: string[] = [];
  PERSON_RE.lastIndex = 0;
  while ((m = PERSON_RE.exec(clean))) people.push(m[1].trim());
  // Cue matches can start with the cue word itself or run back over a sentence boundary; keep only the name.
  // Cue matches can run into a SHOUTED heading ("Finance KEY SKILLS"); cut the capitals run off the end.
  const tidy = (o: string) =>
    o
      .replace(/\s+/g, " ")
      .replace(/^.*\.\s+/, "")
      .replace(/^(?:for|from|at|with|by)\s+/i, "")
      .replace(/(?:\s+(?:[A-Z]{2,}|&)){2,}$/, "")
      .replace(/[.,;:]+$/, "")
      .replace(/\s+(?:and|or|of|for|the|with|&)$/i, "")
      .trim();
  const orgCandidates = uniq(orgs.map(tidy).filter((o) => o.length >= 3 && !o.split(" ").every((w) => ORG_SUFFIX_RE.test(w))))
    .filter((o) => !STOP_ORG.has(o) && !/^(?:Dear|Hello|Hi|Good|Kindly|Please|Note|Urgent|Apply|Send|Contact|Whatsapp|Call|Text|Location|Salary|Requirements?|Position|Job|Vacancy|Interested)\b/i.test(o))
    .filter((o) => !isPlaceOnly(o) && !isGenericOrg(o) && !PRODUCTS.has(o.toLowerCase()))
    .slice(0, 6);
  for (const d of domains) {
    const root = d.split(".")[0];
    if (root.length >= 4 && !/^(gmail|yahoo|hotmail|outlook|icloud|wa|api|bit|t|tinyurl|forms|docs|linkedin|facebook|instagram|twitter|x|tiktok|jiji|jobberman|brightermonday|myjobmag|indeed|glassdoor|telegram|whatsapp|google|wa\.me)$/i.test(root)) orgCandidates.push(root);
  }

  const money = extractMoney(clean);
  const feeAsks = money.filter((x) => x.purpose && x.purpose !== "salary" && !/bond|liquidated|resign|damages|penalt|forfeit/i.test(x.context));
  const salary = money.find((x) => x.purpose === "salary") ?? null;
  const bare = clean.replace(EMAIL_RE, " ").replace(URL_RE, " ");
  const destinations = uniq(DESTINATIONS.filter(([re]) => re.test(bare)).map(([, name]) => name));
  const titles = uniq(TITLES.filter(([re]) => re.test(clean)).map(([, name]) => name));
  const channels = uniq(["whatsapp", "telegram", "signal", "wechat", "imo", "skype", "zoom", "google meet", "email", "sms"].filter((c) => new RegExp(`\\b${c}\\b`, "i").test(clean)));
  const countryGuess = opts.hint ?? guessCountry(clean, phones, domains);

  const grab = (re: RegExp): string | null => {
    const r = clean.match(re);
    return r ? r[0].slice(0, 140) : null;
  };
  const signals: Record<string, string | null> = {
    feeAsk: feeAsks.length ? feeAsks[0].context : grab(FEE_WORDS) ? grab(new RegExp(`.{0,80}(?:${FEE_WORDS.source}).{0,80}`, "i")) : null,
    oneWay: grab(/one[- ]way (?:ticket|flight)|ticket (?:is|will be) (?:provided|paid|sponsored|free)|free (?:flight|ticket|air ?fare|visa)|visa and ticket (?:provided|sponsored|covered)|(?:flight|ticket|visa)s? (?:fully )?(?:covered|sponsored|paid for)/i),
    noExperience: grab(/no (?:prior |previous |work )?experience (?:needed|required|necessary)|experience (?:is )?not (?:needed|required)|no qualification|anyone can apply|no (?:interview|exam|test) (?:needed|required)|without interview/i),
    urgent: grab(/\burgent(?:ly)?\b|limited (?:slots?|spaces?|vacancies)|slots? (?:are )?(?:limited|filling)|today only|expires? (?:today|tomorrow|in \d+ (?:hours?|days?))|immediately|act fast|first come|hurry/i),
    selected: grab(/you (?:have been|were|are) (?:selected|shortlisted|chosen|picked)|congratulations[,!]? (?:you|your)|your (?:cv|profile|application) (?:has been|was) (?:selected|shortlisted|approved)/i),
    visaGuarantee: grab(/visa (?:is )?(?:guaranteed|assured|100%)|100% visa|guaranteed (?:visa|job|placement|employment)|no (?:visa )?rejection|assured (?:job|placement)/i),
    personalData: grab(/\b(?:bvn|nin|national id(?:entity)? (?:number|card)|passport (?:copy|scan|number|data page)|bank (?:details|account)|atm card|card details|ssn|kra pin|ghana card number|date of birth and)\b/i),
    taskJob: grab(/\b(?:tasks?|missions?) (?:to )?(?:complete|earn)|earn (?:\$|₦|ksh|ush|gh₵)?\s?[\d,]+ (?:daily|per day|per task)|like (?:and share )?videos|boost(?:ing)? (?:products|merchants|sales)|(?:optimi[sz]e|rate|review) (?:products|hotels|apps)|commission (?:per|on each) (?:task|order)|usdt|part[- ]time online job|work from (?:home|phone)/i),
    telegramOnly: channels.includes("telegram") && !emails.length && !urls.length && !phones.length ? "telegram contact only" : null,
    depositBeforeInterview: grab(/(?:before|prior to) (?:the )?(?:interview|onboarding|start(?:ing)?|resumption|training)[^.]{0,60}(?:pay|fee|deposit)|(?:pay|fee|deposit)[^.]{0,60}(?:before|prior to) (?:the )?(?:interview|onboarding|start|resumption|training)/i),
    contractAbroad: destinations.filter((d) => !["Nigeria", "Kenya", "Uganda", "Ghana"].includes(d)).length ? "destination abroad mentioned" : null,
    trainingBond: grab(/(?:training|employment|service) bond|bond(?:ed)? (?:for|of) (?:\d+|one|two|three|four|five) (?:years?|months?)|liquidated damages|(?:repay|refund|reimburse)[^.]{0,60}training|serve (?:the company )?for (?:a (?:minimum|period) of )?(?:\d+|one|two|three|four|five) (?:years?|months?)/i),
    probation: grab(/probation(?:ary)?(?: period)?[^.]{0,80}/i),
    unpaidProbation: grab(/(?:unpaid|no salary|without (?:pay|salary)|not (?:be )?(?:paid|entitled to (?:any )?salary)|half (?:pay|salary)|50% (?:of )?(?:the )?salary)[^.]{0,60}probation|probation[^.]{0,120}(?:unpaid|no salary|without (?:pay|salary)|not (?:be )?paid|half (?:pay|salary)|50%)/i),
    withheldCerts: grab(/(?:original|originals of your) (?:certificates?|credentials|documents?|degree|diploma|passport)[^.]{0,80}(?:submit|deposit|keep|retain|held|hold|surrender|custody|collateral)|(?:submit|deposit|surrender|keep|retain|hold)[^.]{0,60}original (?:certificates?|credentials|documents?|passport)/i),
    noNotice: grab(/(?:terminate|dismiss|end)[^.]{0,50}(?:without (?:any )?notice|at any time without|with immediate effect and without)|no notice (?:period|shall be)|(?:24|48) hours?['’]? notice|(?:one|1|two|2|three|3) days?['’]? notice/i),
    nonCompete: grab(/non[- ]?compete|shall not[^.]{0,40}(?:work|engage|employ)[^.]{0,40}(?:competitor|competing|similar business)[^.]{0,60}(?:\d+|one|two|three|five) (?:years?|months?)|restraint of trade/i),
    foreignCurrencySalary: salary && !["NGN", "KES", "UGX", "GHS"].includes(salary.currency) ? salary.raw : null,
  };

  return {
    kind: classifyKind(clean, !!opts.hasUrlOnly),
    text: clean,
    orgCandidates: uniq(orgCandidates),
    people: uniq(people).slice(0, 3),
    emails,
    phones,
    domains,
    urls,
    money,
    feeAsks,
    salary,
    destinations,
    titles,
    channels,
    countryGuess,
    signals,
    source: "heuristic",
  };
}
