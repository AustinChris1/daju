# Daju

**Is this sender on file?**

Paste a job advert, a recruiter's WhatsApp message or an offer letter. Daju reads the names, numbers, emails and amounts, looks them up in the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana, applies the lure patterns documented in official trafficking warnings, checks six offer-letter clauses against the labour statute with a citation, and hands you a reply to send. It never says "safe".

Built for the StacStart Borderless Bytes hackathon (Future of Work track), September 2026.

## The name and the mark

Daju is Yoruba: dájú, to be sure, to be certain. Written without tones it is four letters; with two high tones it means certain. The mark is those two tone marks, impressed in stamp ink inside a double-ring seal: the tone is the certainty, the seal is the register that earns it. The wordmark keeps the tones, dájú, because they are the difference between a word and its meaning, the way a seal is the difference between a photocopy and a certified true copy. Inline SVG in `src/components/brand/Mark.tsx`; palette, type and the four directions considered are at `/brand`.

## What one check does

1. **Reads the message.** Organisation names, people, phones (normalised to E.164 for the four countries), emails, domains, money with purpose, destinations, job titles, contact channels, and 20 named signals. Claude may refine the extraction when a key is present; the rule engine never depends on it.
2. **Looks up four registers at once.** Name match after stripping legal suffixes, then the crucial step: the phone, email and domain in the message are compared with the record, only on channels both sides have. A name that matches with a contact that does not is treated as impersonation, the highest-severity finding.
3. **Applies 20 lure rules,** each citing the official warning it comes from (Kenya MFA on Myanmar and Cambodia, NAPTIP on fraud factories, Uganda MGLSD on unlicensed brokers, Ghana MELR, the AP investigation into Alabuga Start).
4. **Checks six clauses in offer letters** (training bond, probation, withheld certificates, notice, foreign-currency salary, non-compete) against the Employment Act 2007 (KE), Employment Act 2006 (UG), Labour Act 2003 Act 651 (GH) and Labour Act Cap L1 (NG), or the leading National Industrial Court decision where Nigeria has no statute. Every citation was hand-verified against the official text; where none exists the card says so.
5. **Hands you the reply.** Fixed templates in English and Nigerian Pidgin; Igbo, Yoruba, Hausa, Swahili, Luganda and Twi by machine translation, labelled. Plus the verified hotline for the country, a shareable card link, and one-tap reporting of the contact.

**Employers** prove control of their domain with one DNS TXT record and issue offer links. A candidate who pastes the link sees a verified sender on the card.

## Data

| Country | Source | Entries | Snapshot |
|---|---|---|---|
| Nigeria | NELEX, Federal Ministry of Labour and Employment | 1,186 | 2026-09-21 |
| Kenya | NEA register via the State Department for Diaspora Affairs | 1,295 (515 active) | 2026-05-18 |
| Uganda | EEMIS, Ministry of Gender, Labour and Social Development | 195 | 2026-09-21 |
| Ghana | GLMIS, Ministry of Employment and Labour Relations | 322 | 2026-09-21 |

Snapshots live in `data/registries/` with their source URL and method, and are refreshed by `node scripts/registries/all.mjs`. A check never calls a government site. Caveats per register are in `data/registries/index.json` and on `/method`. Statute citations, hotlines and quoted warnings are in `data/law/`.

## Run it

```bash
pnpm install
cp .env.example .env.local   # optional keys
pnpm dev
```

Optional: `ANTHROPIC_API_KEY` enables extraction refinement and reply translation. For a persistent store, connect Supabase (the Vercel Supabase integration sets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; leave its variable prefix empty, or set `SUPABASE_ENV_PREFIX` to the prefix you chose), then create the tables once:

```bash
vercel env pull .env.local
node scripts/db-init.mjs
```

Without a store the app runs fully on the rule engine and keeps cards in memory.

## API

```
POST /api/check              { text | url | name | phone | email, country? }  -> { report }
GET  /api/check/:id
POST /api/check/:id/translate { lang }
GET  /api/registry?q=&country=&status=&offset=&limit=
GET  /api/registry/:country/:id
POST /api/report             { kind, value, country?, note? }
POST /api/employers          { company, domain, country, contactEmail }
POST /api/employers/verify   { manageKey }
POST /api/offers             { manageKey, role, candidate?, country }
GET  /api/offers/:token
POST /api/watch              { email, country, entryId }
GET  /api/stats
```

## Scripts

- `scripts/registries/*.mjs`: register scrapers, one per country, plus `all.mjs`.
- `scripts/smoke-check.mts`: runs extraction and lure rules on five composite inputs (`./node_modules/.bin/tsx scripts/smoke-check.mts`).
- `scripts/shots.mjs`: screenshots every route in both themes at desktop and phone width using the installed Chrome (`MSYS_NO_PATHCONV=1 node scripts/shots.mjs http://localhost:3000 shots` on Git Bash).

## Limits, stated plainly

- Direct employers are not agencies and do not appear in agency registers. "Not on file" is not a scam signal on its own.
- Ghana's directory carries no licence status; Kenya's snapshot is from May 2026.
- Only Uganda publishes phone numbers; the others publish emails. Contact comparison uses whatever channel exists.
- Clause flags are information with a citation, not legal advice.
