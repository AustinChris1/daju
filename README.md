# Daju

**Is this sender on file?** Paste a job message. Daju checks whether the person contacting you is the organisation they claim to be, using the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana.

Live: https://daju-bice.vercel.app · Docs: https://daju-bice.vercel.app/docs

## The thesis

A scammer can copy a real company's name. They cannot copy its registered phone number, its email domain, or its licence. So Daju does not ask "does this look like a scam". It asks: **is the name on a government register, and is the contact in this message the contact on file?**

The most common trick in these four countries is exactly that: a licensed agency's name with the scammer's own WhatsApp number. 751 Kenyans have been rescued from Myanmar scam compounds since 2022, and Uganda revoked 275 recruitment licences in one month.

## What one check does

1. Reads the names, phone numbers, emails, domains and amounts in the message.
2. Looks the name up in all four registers at once and compares the contact in the message with the contact on file. Name matches, contact does not: impersonation.
3. Checks the sender's domain: age, mail records, lookalikes, whether its website is live and names the company. For a Nigerian company that is not an agency, it looks the name up on the CAC register live (through Mono) and shows the RC number and status.
4. Applies 20 lure patterns from official warnings, each cited to its source, and six offer-letter clauses against the country's labour law.
5. Returns a stamped card: Stop, Caution, On file, or Not on file. Never "safe". Plus the reply to send and the official hotline.

**Try it:** open the live site and press "Uganda Gulf housemaid job". Moonlight Recruiting is on Uganda's register; the number in the message is not the number on file. The card shows both.

## For employers

Prove control of your domain with one DNS record. Then issue offer links that show candidates a verified sender, and post roles on a jobs board where every listing comes from a verified domain. The company was real; now the person can be too.

## Also in the box

- Forward a message to the Telegram or WhatsApp bot and get the same card back as text.
- Upload, drop or paste a screenshot; it is read in the browser and never uploaded.
- Replies in English and Pidgin, six more languages by machine translation.
- All four registers re-read every Monday, the difference committed and shown; watch an entry and get emailed when its licence changes.
- A live radar of stamps, lures, reports and register movement.
- Everything above as a JSON API.

## Data

| Country | Register | Entries | Snapshot |
|---|---|---|---|
| Nigeria | NELEX, Federal Ministry of Labour and Employment | 1,186 | 2026-09-24 |
| Kenya | NEA register via the State Department for Diaspora Affairs | 1,295 (515 active) | 2026-05-18 |
| Uganda | EEMIS, Ministry of Gender, Labour and Social Development | 190 | 2026-09-24 |
| Ghana | GLMIS, Ministry of Employment and Labour Relations | 322 | 2026-09-24 |

Snapshots live in `data/registries/`, statute citations, hotlines and quoted warnings in `data/law/`, each with its source URL. A check never calls a government site. Caveats per register are in [docs/data-and-limits.md](docs/data-and-limits.md).

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without keys the app runs fully on the rule engine with an in-memory store. Optional: Supabase for persistence, Claude or Groq for extraction refinement and translations, Telegram and Twilio for the bots. Setup for each is in [docs/how-to-use.md](docs/how-to-use.md).

## Stack

Next.js 16, TypeScript, Tailwind v4, Supabase (Postgres), Vercel. The rule engine is plain TypeScript in `src/lib`. No model decides a verdict.

## Docs

- [How a check works](docs/how-it-works.md): what happens to a pasted message, step by step.
- [How to use Daju](docs/how-to-use.md): job seekers, employers, bots, API, running it yourself.
- [Architecture](docs/architecture.md): modules, data flow, storage, deployment.
- [Data sources and limits](docs/data-and-limits.md): registers, law, warnings, what Daju cannot know.
- [Business model](docs/business-model.md): who pays.

## Licence and credits

Code: MIT. Register data belongs to the publishing ministries and is redistributed as dated snapshots for verification only. Photographs on the landing page are used under the Unsplash licence; credits in `public/images/CREDITS.md`.
