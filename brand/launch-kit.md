# Daju launch kit

Everything needed to submit, post and pitch. Images are in `public/brand/` and served from the live site under `/brand/…`.

## Files

| File | Use |
|---|---|
| `daju-mark.svg`, `daju-mark-1024.png` | The tone seal, violet on transparent. Avatars, favicons, slide corners. |
| `daju-mark-white-1024.png` | The seal in cream, for dark or violet backgrounds. |
| `daju-icon-512.png` | App icon: cream seal on violet, rounded. Telegram bot picture, Twilio sender picture. |
| `daju-wordmark-light.png`, `daju-wordmark-dark.png` | Seal plus dájú, transparent, for light and dark surfaces. |
| `daju-cover-1500x500.png` | X and LinkedIn header. |
| `daju-social-1200x630.png` | Link preview card, LinkedIn post image, the submission form cover. |
| `daju-post-1080x1080.png` | Square post: the Moonlight case, stamped. |
| `daju-story-1080x1920.png` | WhatsApp status, Instagram story. |

Regenerate after any brand change: `MSYS_NO_PATHCONV=1 node scripts/brand-assets.mjs`.

## Submission form

**Project name:** Daju

**One line:** Is this sender on file? Job-offer checks against the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana.

**Track:** Future of Work. Secondary: Access and Inclusion.

**Problem (short):** The most common job scam in these four countries is not a fake company. It is a real, licensed agency's name with the scammer's own WhatsApp number. A job seeker cannot tell the difference from the message alone, and no tool checks the sender against the government register.

**Solution (short):** Paste the message, or forward it to the Telegram or WhatsApp bot. Daju reads the names, numbers, emails and domains, looks the name up in all four registers at once, and compares the contact in the message with the contact on file. Name matches, contact does not: impersonation. It adds 20 lure patterns from official warnings, six offer-letter clauses against the country's labour law, the reply to send in English or Pidgin, and the official hotline. Employers prove their domain with one DNS record and post roles on a board where every listing is verified.

**What is real:** four register snapshots (NELEX 1,186; NEA 1,295; EEMIS 190; GLMIS 322), re-read every Monday with the difference committed; every citation and hotline verified against its official page; no model decides a verdict; the card never says "safe".

**Target users:** job seekers in NG, KE, UG, GH who receive offers on WhatsApp, Telegram and email; recruiters and employers who are impersonated.

**Stack:** Next.js 16, TypeScript, Tailwind v4, Supabase, Vercel, GitHub Actions. Optional Groq or Claude for extraction refinement and translation. Telegram Bot API and Twilio for the bots. tesseract.js for on-device screenshot reading.

**Links:** https://daju-bice.vercel.app · https://github.com/AustinChris1/daju · docs at /docs

## Video script (75 seconds, phone in hand)

1. (0 to 8s) A WhatsApp message on screen: "We are agents of Moonlight Recruiting Agency Uganda Ltd. Pay medical fee UGX 350,000. WhatsApp 0756 000 111 now." Voice: "This is real. Moonlight is a licensed agency in Uganda."
2. (8 to 20s) Forward it to the Daju bot. The stamp appears: STOP. "Name is on file, contact is not." Read the two numbers aloud: the one on the register, the one in the message.
3. (20 to 32s) Press "Reply in Pidgin". Show the reply. Press "Send on WhatsApp". Done. "That took twelve seconds."
4. (32 to 45s) Website. Paste the Lagos offer letter. Three clauses with the Act and the court case. "It reads the contract too."
5. (45 to 58s) Employer console. TXT record verified. Issue an offer link. Paste it into a check: "Verified sender." "Scammers copy names. They cannot copy a DNS record."
6. (58 to 70s) Registers page: "What moved on 24 September: four Ugandan licences expired on Monday and left the register." "The data moves every week."
7. (70 to 75s) Black screen, one line: "The company was real. The person wasn't." Logo.

## Posts

**X, launch**
Someone sends you a job. The agency is licensed. The number is not theirs.
Daju checks the sender against the government registers of 🇳🇬🇰🇪🇺🇬🇬🇭 and hands you the reply.
Free. No sign-up. It never says "safe".
daju-bice.vercel.app

**X, the case**
Moonlight Recruiting Agency Uganda Ltd is on the EEMIS register. Licence E26050027, valid to 2028.
The WhatsApp number in the "job" is not the number on file.
That is the whole scam, and Daju catches it in one paste.

**LinkedIn**
We built Daju for the Borderless Bytes hackathon because the job scams hitting graduates in Nigeria, Kenya, Uganda and Ghana no longer look fake. They use real, licensed agency names with the scammer's own WhatsApp number.

Daju reads a pasted job message, looks the name up in all four government registers, and compares the contact in the message with the contact on file. Name matches, contact does not: impersonation. It adds the official warning patterns, checks offer-letter clauses against the country's labour law, writes the reply, and shows the hotline. Employers prove their domain with one DNS record and post verified roles.

The registers are re-read every Monday and the difference is committed. Last week four Ugandan licences expired and left the register; Daju noticed.

It never says an offer is safe. It says what the register says, with the date.

Try it: daju-bice.vercel.app. Telegram bot and WhatsApp in the docs.

**WhatsApp group or status**
Before you reply to that job message, paste it here: daju-bice.vercel.app
It checks the name and number against the government list of licensed agencies (Nigeria, Kenya, Uganda, Ghana) and gives you the reply to send. Free, no sign-up.

**Telegram channel**
@DajuCheckBot is live. Forward any job message or offer letter and get a stamped card back: Stop, Caution, On file, or Not on file, with the register entry, the warning it matched, the reply to send, and the hotline. Try /start for four real examples.

## Pitch, 90 seconds spoken

Judges, the company in this message is real. Moonlight Recruiting is licensed in Uganda. The person is not. The phone number in the message is not the number on the register, and that one fact is the whole scam.

Daju is the check. Paste the message, or forward it to our Telegram or WhatsApp bot. It reads the names, numbers and emails, looks them up in the four government registers of Nigeria, Kenya, Uganda and Ghana, and compares what is in the message with what is on file. Then it applies twenty lure patterns from official warnings, checks the contract clauses against the labour law, writes the reply, and shows the hotline.

For employers, the other half: prove your domain with one DNS record, issue offer links, post verified roles. Scammers copy names. They cannot copy a DNS record.

Everything on a card carries a date and a source. The registers are re-read every Monday. It never says "safe".

The company was real. The person wasn't. That is what Daju tells you.
