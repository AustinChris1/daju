# Daju

**Is this sender on file?** Check a job offer against the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana before you reply.

Live: https://daju-bice.vercel.app · Docs: https://daju-bice.vercel.app/docs

## The problem

Job scams in these four countries now target educated, tech-savvy graduates with offers in IT, marketing and customer service. 751 Kenyans have been rescued from Myanmar scam compounds since 2022, 156 Nigerians from online fraud centres in the first seven months of 2026, and Uganda revoked 275 recruitment licences in a single month. The most common trick is simple: use a real, licensed agency's name with the scammer's own WhatsApp number.

## What Daju does

Paste the message. Daju:

1. Reads the names, phone numbers, emails, domains and amounts in it.
2. Looks the name up in all four government registers at once, and checks whether the phone or email in the message is the one on file. A name that matches with a contact that does not is treated as impersonation.
3. Applies 20 lure patterns taken from official warnings, each cited to its source.
4. Checks six offer-letter clauses (training bond, probation, withheld certificates, notice, currency, non-compete) against the labour law of the country, with the section or the leading court decision.
5. Writes the reply to send, in English or Pidgin (six more languages by machine translation), and shows the official hotline.

Every card carries the register snapshot dates. It never says "safe".

Employers prove control of their domain with one DNS record and issue offer links that show candidates a verified sender.

## Try it in one minute

Open the live site, press one of the example chips ("Uganda Gulf housemaid job" shows a licensed name with the wrong number), or paste any job message from your own WhatsApp.

## Data

| Country | Register | Entries | Snapshot |
|---|---|---|---|
| Nigeria | NELEX, Federal Ministry of Labour and Employment | 1,186 | 2026-09-21 |
| Kenya | NEA register via the State Department for Diaspora Affairs | 1,295 (515 active) | 2026-05-18 |
| Uganda | EEMIS, Ministry of Gender, Labour and Social Development | 195 | 2026-09-21 |
| Ghana | GLMIS, Ministry of Employment and Labour Relations | 322 | 2026-09-21 |

Snapshots live in `data/registries/` and are refreshed with `pnpm registries`. Statute citations, hotlines and quoted warnings are in `data/law/`, each with its source URL. A check never calls a government site.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without any keys the app runs fully on the rule engine with an in-memory store. Optional: a Supabase database for persistent cards, and Claude or Groq for extraction refinement and translations. See `docs/how-to-use.md`.

## Stack

Next.js 16, TypeScript, Tailwind v4, Supabase (Postgres), Vercel. The rule engine is plain TypeScript in `src/lib`. No model decides a verdict.

## Docs

- `docs/how-it-works.md`: what happens to a pasted message, step by step.
- `docs/architecture.md`: modules, data flow, storage, deployment.
- `docs/how-to-use.md`: job seekers, employers, API.
- `docs/data-and-limits.md`: sources, snapshot caveats, what Daju cannot know.
- `docs/business-model.md`: who pays.

## Telegram — Forward it to Daju

Forward a recruiter outreach, job advert, or offer letter directly to the Daju Telegram bot to check it against the four government registers in seconds.

### Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) on Telegram and copy the API token.
   - Suggested description: `"Forward a suspicious job or recruiter message. Daju checks sender identity and evidence across recruitment records in Nigeria, Kenya, Uganda and Ghana."`
2. In `.env.local` or your Vercel project environment, configure:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
   TELEGRAM_WEBHOOK_SECRET=your_random_secret_token
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```
3. Register the webhook with Telegram:
   ```bash
   node scripts/telegram/set-webhook.mjs set https://your-domain.vercel.app/api/telegram/webhook
   ```
   To inspect webhook health:
   ```bash
   node scripts/telegram/set-webhook.mjs info
   ```
   To delete the webhook:
   ```bash
   node scripts/telegram/set-webhook.mjs delete
   ```

### Supported inputs

- **Text messages & forwarded text:** Full message text is analyzed by the core engine.
- **Captions:** Text attached as a caption to any forwarded message.
- **Commands:** `/start` explains the tool, `/help` explains supported formats.

*Note on attachments:* Images, screenshots, PDFs, and voice notes are intentionally unsupported in this release; the bot politely directs users to paste or forward the text. Client-side screenshot OCR is in development.

## Licence and credits

Code: MIT. Register data belongs to the publishing ministries and is redistributed as dated snapshots for verification only. Photographs on the landing page are used under the Unsplash licence; credits in `public/images/CREDITS.md`.
