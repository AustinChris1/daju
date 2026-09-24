# How to use Daju

## If you received a job message

1. Open the site and go to **Check**.
2. Paste the whole message, ad or offer letter. Include the phone number and email exactly as they appear; those are what gets compared to the register. A screenshot works too: press **Upload a screenshot**, drop the image on the box, or paste it with Ctrl+V. The text is read on your device and never uploaded.
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

## On WhatsApp or Telegram

Forward the message to the Daju bot and the same card comes back as text, with the link to the full card.

- **Telegram**: create a bot with @BotFather and copy its token. Set `TELEGRAM_BOT_TOKEN`, a random `TELEGRAM_WEBHOOK_SECRET` and `NEXT_PUBLIC_SITE_URL`, then register the webhook:

  ```bash
  node scripts/telegram/set-webhook.mjs set https://<your site>/api/telegram/webhook
  node scripts/telegram/set-webhook.mjs info     # check it
  node scripts/telegram/set-webhook.mjs delete   # remove it
  ```

  The bot reads text and captions; `/start` and `/help` explain it. Photos and documents get a note to paste the text.
- **WhatsApp**: in the Twilio console open Messaging, Try it out, Send a WhatsApp message, and set the sandbox "when a message comes in" URL to `https://<your site>/api/whatsapp/webhook` (POST). Put the account auth token in `TWILIO_AUTH_TOKEN` so unsigned requests are refused. Anyone who sends the sandbox join phrase to the Twilio number can then forward messages. A production WhatsApp sender needs a Meta Business verification, which takes days and is outside the hackathon window.

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
