# Daju: what's left before 28 September

Submission closes 28 Sept 2026, 11:59 PM WAT. Deliverables: live URL, public GitHub repo, video pitch, project details form. Finale pitch 8 Oct.

Live: https://daju-bice.vercel.app · Repo: https://github.com/AustinChris1/daju · Deploys automatically from `main`.

## Done

- Rule engine: extraction, four-register lookup with contact matching, 20 cited lure rules, six clause checks with verified citations, replies in English and Pidgin, hotlines.
- Four register snapshots (NG 1,186 · KE 1,295 · UG 190 · GH 322) with dates and caveats.
- Pages: landing, check, shareable card with WhatsApp preview image, registers directory, employer console with DNS verification and offer links, report, hotlines, method, brand.
- Supabase persistence via the Vercel integration; tables created; cards reload by URL.
- Brand: Daju, the tone-seal mark, palette, type. Colour landing with live replay, case slider, photo band, mobile menu.
- Optional model: Claude or Groq (`openai/gpt-oss-120b`) for extraction refinement and translations.
- Real-ad test on nine WhatsApp-group posts: eight clean direct employers, one young domain flagged as Caution.
- Forward it to Daju: Telegram bot adapter (`/api/telegram/webhook`), formatter, deduplication, and setup CLI. Needs a bot token in Vercel and the webhook registered.
- Forward it to Daju on WhatsApp: `/api/whatsapp/webhook` for the Twilio sandbox (signature check, TwiML reply, 1600-character fit). Needs the sandbox webhook URL set and `TWILIO_AUTH_TOKEN` in Vercel.
- Verified jobs board: domain-verified employers post roles from the console; `/jobs` lists them with the verified badge; the apply address must be on the verified domain.
- Live website check: a check fetches the company homepage and reports live, parked or HTTP error, and whether the page names the company.
- Radar page (`/radar`): live counts of checks, stamps, lures, reports, verified employers and roles, register movement; refreshes every 30 seconds.
- Screenshot input: a WhatsApp or email screenshot is read in the browser (tesseract.js), never uploaded; upload, drop or Ctrl+V.
- Organisation extractor ignores neighbourhood and city names (Chevron, Lekki, Ajah, Westlands, Kololo, East Legon and so on).
- Data that moves: weekly GitHub Actions re-snapshot of all four registers with a committed diff (`data/registries/changes.json`), a "what moved" panel on the registers page, and licence-watch emails through a Vercel cron (`/api/watch/notify`, Resend). Needs `CRON_SECRET` and `RESEND_API_KEY` in Vercel.

## Build queue (agreed order)

3. Meta WhatsApp Business application for a production sender, after the hackathon.
4. Small: hand-written Igbo reply template if a native speaker writes it.

## Only humans can do these

- [ ] Five conversations: last time an offer went wrong, what did you do in the five minutes after. No pitching. Owner: both of you, tonight.
- [ ] Two or three real scam messages from your groups (Thailand, Gulf, "pay a processing fee", "you have been shortlisted"), victims' names removed. The clean ads are in; the bad ones prove the product.
- [ ] Add the TXT record for one domain you control (Namecheap: Advanced DNS, TXT, host `_daju`, value from the employer page) and press Verify. Without this there is no employer beat in the demo.
- [ ] Vercel env: `LLM_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL=openai/gpt-oss-120b`, then redeploy.
- [ ] Twilio: create a free account, open the WhatsApp sandbox, set the "when a message comes in" URL to `https://daju-bice.vercel.app/api/whatsapp/webhook`, add `TWILIO_AUTH_TOKEN` in Vercel, send the join phrase from your phone, then forward a job message. This is the WhatsApp beat in the video.
- [ ] Vercel env for the licence watch: `CRON_SECRET` (any long random string) and `RESEND_API_KEY` from resend.com (free tier); `RESEND_FROM` once a sending domain is verified there.
- [ ] Video, 60 to 90 seconds, phone in hand, four forwards, no architecture talk.
- [ ] Project details form: title Daju, target audience (job seekers and employers in NG, KE, UG, GH), stack (Next.js 16, TypeScript, Tailwind, Supabase, Vercel, Groq or Claude optional).
- [ ] Decide the demo employer: austinchris.me is the easiest since it's yours.

## Demo, in this order, no explaining

1. Thailand customer-service ad → Stop. Hotline on screen.
2. Uganda Gulf ad naming Moonlight Recruiting → "Name is on file, contact is not". Read the EEMIS number aloud.
3. Lagos offer letter → three clauses with the Act and case citations.
4. Your verified employer's offer link → verified sender.
5. One line, cold: "The company was real. The person wasn't." Sit down.

## Working agreements

- Work in this repo on `main` or short branches; small commits; push often. No AI co-author lines or mentions in commits.
- `pnpm install`, copy `.env.example` to `.env.local`, `pnpm dev`. Without keys the app runs fully on the rule engine with an in-memory store.
- Before a push you care about: `pnpm build`. A failed build never goes live, but a green one does within a minute.
- The card never says "safe". Every claim on a card cites a register snapshot date, a statute section or an official warning.
