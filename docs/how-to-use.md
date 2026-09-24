# How to use Daju

## If you received a job message

1. Open the site and go to **Check**.
2. Paste the whole message, ad or offer letter. Include the phone number and email exactly as they appear; those are what gets compared to the register.
3. Pick your country, or leave it on detect.
4. Press **Check this offer**.

You get a card with a stamp at the top (Stop, Caution, On file, or Not on file), what was found and why, the register entry if any, the clauses if it was an offer letter, a reply you can edit and send, and the hotlines for your country.

Useful buttons on the card:

- **Send on WhatsApp** sends the reply.
- **Share card to the group** posts a link to the card, with a preview that shows the stamp.
- **Report** a phone number, email or domain so the next person who checks it sees the count.
- **Does not apply** strikes through a finding you know is wrong for your case.

What the stamps mean:

- **Stop**: a high-severity finding, for example money asked before work, a licensed name with the wrong number, an expired licence, or a Thailand or Cambodia lure.
- **Caution**: medium findings, for example a free email address for a "company", a domain younger than 90 days, or a guaranteed visa.
- **On file**: the agency is on the register, its contact matches, and no lure patterns matched. Still call the number on the register before paying anything.
- **Not on file**: nothing matched a register and nothing looked wrong. Normal for a company hiring directly. Verify the company another way.

## If you are an employer or recruiter

1. Go to **Employers** and register your company with its own domain (free email domains are refused).
2. Add the TXT record shown to your DNS and press **Verify now**. Propagation can take minutes to hours.
3. Once verified, issue an offer link per candidate. Put it in the offer email. When the candidate pastes it into a check, the card shows your company as a verified sender with the date.

4. Post a role. It appears on **Jobs** with a verified badge, and the apply address must be on your domain, so a candidate can tell a real message about it from a borrowed one.

Keep the manage key; it is the only way back into your console.

## If you build job boards or messaging tools

The same engine is available as JSON:

```
POST /api/check
{ "text": "<the message>", "country": "NG" }
→ { "report": { verdict, identity, lure, clauses, actions, registryAsOf, ... } }

GET  /api/registry?q=moonlight
GET  /api/registry/UG/ug-0001
POST /api/report   { "kind": "phone", "value": "+256756000111", "country": "UG" }
GET  /api/stats
```

Requests are rate-limited per IP. Cards created through the API get the same shareable URL.

## Running it yourself

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- No keys: everything runs on the rule engine; cards live in memory until restart.
- Supabase: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (the Vercel integration does this), then create tables once with `node scripts/db-init.mjs` or `POST /api/db/init`.
- Model: either `ANTHROPIC_API_KEY`, or `LLM_PROVIDER=groq` with `GROQ_API_KEY` and `GROQ_MODEL=openai/gpt-oss-120b`.
- Refresh registers: `pnpm registries`.
- Smoke test: `./node_modules/.bin/tsx scripts/smoke-check.mts`.
