# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 App Router, TypeScript, Tailwind v4, Framer Motion, pnpm. Vercel deploy. Supabase optional store with in-memory fallback. Claude API optional for extraction refinement and reply translation; the rule engine never depends on it.

## Users

Two audiences of equal weight (confirmed by the owner, 2026-09-21):

1. A job seeker in Nigeria, Kenya, Uganda or Ghana holding a job advert, a recruiter's WhatsApp or Telegram message, or an offer letter, on a phone, deciding in the next few minutes whether to reply, pay, sign or travel. Often a recent graduate; NAPTIP notes traffickers now target educated, tech-savvy graduates with IT, digital marketing, crypto and customer-service offers.
2. An employer or licensed recruiter in the same four countries who wants candidates to be able to tell their real offer from the fakes that borrow their name. Judges at the StacStart summit are employer partners of this kind.

## Product Purpose

Daju answers "is this sender on file?" before a job seeker replies. It compares the name, phone, email and domain in a message against four government registers of licensed employment agencies (Nigeria NELEX, Kenya NEA, Uganda EEMIS, Ghana GLMIS), applies documented lure patterns from official trafficking warnings, flags six abusive offer-letter clauses against the relevant labour statute with a citation, and hands the user a ready-to-send reply and the official hotline. Employers prove control of their domain once and issue verified offer links. Success: a person who was about to pay a fee, hand over certificates or board a plane checks first, and an employer's real offers carry a badge scammers cannot forge.

## Positioning

The only tool that matches a message's contact details against the actual licensed-agency records of all four countries at once, with dated snapshots, and never says "safe". Existing scam checkers are text classifiers; government portals cover one country each and require the user to know they exist.

## Operating Context

WhatsApp job groups, Telegram channels, LinkedIn and Jobberman-style boards, and offer letters received as PDF or photo. Government registers used as evidence: NELEX (about 1,200 agencies), NEA Kenya (via the diaspora.go.ke register, about 1,300 with licence numbers), EEMIS Uganda (licensed external recruitment companies with phone and licence validity), GLMIS Ghana (agency directory, no licence status; the Ministry announced a licensed list on 8 Sept 2026). Statutes: Employment Act 2007 (KE), Employment Act 2006 (UG), Labour Act 2003 Act 651 (GH), Labour Act Cap L1 LFN 2004 (NG). Hackathon: StacStart Borderless Bytes, build week 22 to 28 Sept 2026, live finale 8 Oct 2026, judged by employer partners.

## Capabilities and Constraints

- Inputs: pasted text, a URL, or name plus phone or email. Screenshot OCR is a later addition, not the happy path.
- Registry data is a dated snapshot bundled in the repo; live sites are never called during a check.
- Verdict levels: stop, caution, on file, not on file. The product never outputs "safe".
- Contact mismatch against a name match is treated as impersonation, the highest-severity signal.
- Clause citations are static, hand-verified section references; no model generates law.
- Replies ship in English and Nigerian Pidgin as fixed templates; Igbo, Yoruba, Hausa, Swahili, Luganda and Twi are machine translated and labelled as such.
- Employer verification is by DNS TXT record on the employer's own domain.
- No native Node modules (Windows build machine without a C++ toolchain).
- Undecided: WhatsApp Cloud API integration (deferred), licence-watch email alerts (data model exists, sending not wired).

## Brand Commitments

Name: Daju, chosen by the owner on 2026-09-22 (Yoruba dájú, to be sure; wordmark keeps the tone marks: dájú). Rejected on the way: True Copy (two words), Byline (jargon), Bonafide (names the verdict), Confam (Confamer app exists), Kagua (kagua.app exists). Tagline: "Is this sender on file?" Voice: plain, dated, cited, never alarmist, never says safe. Owner's standing rules: no em-dashes anywhere, no generic AI aesthetics, a unique meaning-rooted logo. Visual world chosen by the owner on 2026-09-21: photocopy and stamp pad.

## Evidence on Hand

- data/registries/*.json: real scraped registers with as_of dates and source URLs (see data/registries/index.json for method and caveats).
- data/law/*.json: verified statute citations, hotlines and official lure-warning quotes with source URLs.
- Public figures for the pitch: 751 Kenyans rescued from Myanmar scam compounds since 2022 and 393 from Cambodia in Jan to Apr 2026 (Kenya MFA to the Senate, May 2026); 156 Nigerians rescued Jan to Jul 2026 (NAPTIP); 275 Ugandan agency licences revoked April 2026 (MGLSD); Ghana licensed-agency list announced 8 Sept 2026.
- Absent, must not be fabricated: user counts, testimonials, partner employers, uptime or accuracy claims.

## Product Principles

1. Evidence over verdicts: every flag shows what it matched, where it came from and the snapshot date.
2. Never green-light: the strongest positive statement is "on file, contact matches, no lure signals found".
3. The reply is the product: every card ends with something the person can send in the next minute.
4. One check, both sides: the same card serves the job seeker and the employer whose name was borrowed.
5. Works on the worst phone in the group: text first, small payloads, no dependency on the model or the store to render a result.
