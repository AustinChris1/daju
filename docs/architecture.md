# Architecture

Daju is a Next.js 16 application with a plain-TypeScript rule engine, dated register snapshots committed to the repository, an optional Postgres store, and an optional language model. Nothing on the verdict path depends on a network call.

## The system

```mermaid
flowchart LR
  subgraph channels[Where a message arrives]
    web[Website: paste, screenshot OCR]
    tg[Telegram bot]
    wa[WhatsApp via Twilio]
    api[JSON API]
  end
  subgraph vercel[Vercel functions]
    engine[Rule engine<br/>src/lib/check/engine.ts]
    store[(Supabase<br/>checks, reports, employers,<br/>offers, jobs, watches)]
  end
  subgraph data[Committed data, refreshed weekly]
    reg[(Four register snapshots<br/>NELEX, NEA, EEMIS, GLMIS)]
    law[(Citations, hotlines,<br/>quoted warnings)]
  end
  subgraph live[Live lookups, cached]
    rdap[RDAP and MX]
    site[Company website]
    dns[DNS TXT for employers]
  end
  web --> engine
  tg --> engine
  wa --> engine
  api --> engine
  engine --> reg
  engine --> law
  engine --> rdap
  engine --> site
  engine --> store
  store --> card[Card /c/id<br/>with Open Graph image]
  gh[GitHub Actions<br/>every Monday] --> reg
  gh --> diff[changes.json:<br/>what moved]
  cron[Vercel cron<br/>Monday morning] --> watch[Licence-watch emails]
  employer[Employer console] --> dns
```

## One check, step by step

```mermaid
flowchart TD
  in[Message text] --> ex[Extract: names, phones, emails,<br/>domains, amounts, destinations, titles]
  ex --> llm{Model key set?}
  llm -- yes --> refine[Refine extraction into a fixed<br/>JSON shape, validated with Zod]
  llm -- no --> id
  refine --> id[Identity: look each name up<br/>in all four registers]
  id --> cm[Contact match: phone, email, domain<br/>against the record on file]
  cm --> imp{Name matches,<br/>contact does not?}
  imp -- yes --> stop1[Impersonation: high]
  imp -- no --> lure
  stop1 --> lure[20 lure rules,<br/>each cited to an official warning]
  lure --> cl[6 offer clauses against<br/>the country's labour law]
  cl --> dom[Domain: age, MX, lookalike,<br/>website live and names the company]
  dom --> v[Verdict: Stop, Caution,<br/>On file, or Not on file]
  v --> out[Reply templates, hotline,<br/>share text, card and image]
  out --> save[(Store)]
```

The verdict never comes from a model. The model, when configured, only tidies extraction and translates replies.

## Modules

| Path | Role |
|---|---|
| `src/lib/extract/heuristics.ts` | Pattern extraction: contacts, money, destinations, titles, 20 signals |
| `src/lib/extract/llm.ts` | Optional refinement and translation via Claude or Groq |
| `src/lib/registry/load.ts` | Loads the four snapshots, builds name, phone, email and domain indexes |
| `src/lib/registry/match.ts` | Name normalisation, similarity, phone normalisation |
| `src/lib/rules/lure.ts` | Lure rules with source ids into `data/law/lure_sources.json` |
| `src/lib/rules/clauses.ts` | Clause detection with citations from `data/law/clauses.json` |
| `src/lib/intel/domain.ts` | Live domain checks with a six-hour cache |
| `src/lib/check/engine.ts` | Orchestrates a check and computes the verdict |
| `src/lib/check/replies.ts` | Reply templates by scenario, English and Pidgin |
| `src/lib/store/index.ts` | Store interface, memory and Supabase drivers |
| `src/app/api/*` | Route handlers: check, registry, report, employers, offers, jobs, watch, radar, telegram, whatsapp |
| `src/lib/telegram/*` | Telegram API client, HTML cards and keyboards |
| `src/lib/radar.ts` | Live counts for the Radar page |
| `scripts/registries/diff.mjs` | Compares a fresh snapshot with the committed one and records what moved |
| `scripts/registries/*` | Scrapers that produce the snapshots |
| `data/registries/*.json` | The snapshots, with `as_of`, source URL and method |
| `data/law/*.json` | Verified citations, hotlines, quoted warnings |

## Registers

Each country's register is scraped by a script into one JSON file with a common schema (name, normalised name, status, licence number, emails, phones, domains, validity dates). The file records its source URL, the method used and the date. A check reads the bundled snapshot only. This keeps a check fast, keeps the demo independent of government portals, and makes every card reproducible: the snapshot date is printed on it.

Refresh: a GitHub Actions workflow runs `pnpm registries` every Monday, then `scripts/registries/diff.mjs` records additions, removals, status and contact changes in `data/registries/changes.json`, and commits both. A failed scrape keeps the previous snapshot and records the error. A Vercel cron then calls `/api/watch/notify` to email anyone watching an entry that changed.

## Storage

Six tables (`supabase/schema.sql`): checks, reports, employers, offers, jobs, watches. The Supabase driver is used when `SUPABASE_URL` and a key exist; otherwise an in-memory store, which is enough for local development. Tables can be created from inside the deployment with `POST /api/db/init` and a bearer token, because Supabase's direct database host is IPv6-only and unreachable from most laptops.

## Employer verification

An employer registers a company domain and receives a TXT record (`_daju.<domain>`, value `daju-verify=<token>`). Verification resolves that record from the server. Verified employers issue offer links (`/o/<token>`); a check that sees such a link, or an email on a verified domain, marks the sender as verified with the date and method.

## Model use

The model is optional and does two side jobs: refine extraction into a fixed JSON shape (validated with Zod) and translate the reply. Providers: Anthropic (`claude-opus-5`) or any OpenAI-compatible endpoint, Groq by default (`openai/gpt-oss-120b`). No prompt ever asks a model whether something is a scam, and no model output is shown as law.

## Deployment

Vercel, from the `main` branch. Environment: `NEXT_PUBLIC_SITE_URL`, Supabase variables from the Vercel integration, optional model keys, `DB_INIT_TOKEN`, `CRON_SECRET`, `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`. `pg` is kept external at runtime (`serverExternalPackages`).

## Testing

`scripts/smoke-check.mts` runs extraction, lure rules and the clause audit on fixed inputs and fails if the expected findings are missing. `scripts/shots.mjs` screenshots every route in both themes at desktop and phone width and reports horizontal overflow.
