# How a check works

You paste a job advert, a recruiter's message or an offer letter. In under a second Daju does five things, in this order.

## 1. Read

The text is scanned for organisation names, people, phone numbers (normalised to international format for the four countries), emails, web domains, money and what it is for, destination countries, job titles and contact channels. Twenty named signals are extracted at the same time, for example "fee before work", "one-way ticket", "visa guaranteed", "training bond", "original certificates retained".

If a model key is configured (Claude or Groq), the model refines the extraction: it can recover a company name or a fee the patterns missed. It never decides the outcome.

## 2. Look up the registers

Every organisation name is searched in all four registers at once: NELEX (Nigeria), NEA (Kenya), EEMIS (Uganda) and GLMIS (Ghana). Names are compared after stripping legal suffixes, so "Moonlight Recruiting Agency Uganda Ltd" matches "MOONLIGHT RECRUITING AGENCY UGANDA LTD". Matches above 82 percent count; similar names below that are shown, because impersonators change one word.

Then the important step: the phone, email and domain in the message are compared with what the register holds for that agency, only on channels both sides have. A phone-only message cannot contradict an email-only record, and the card says so.

Three outcomes:

- **Contact matches.** The number or email in the message is the one on file.
- **Contact does not match.** The name is on file but the contact is not. This is treated as impersonation, the highest-severity finding, because it is how licensed names are borrowed.
- **Cannot compare.** The register publishes no phone (true for Nigeria, Kenya and Ghana). The card shows the email on file and tells you to use that instead of the number in the message.

## 3. Apply the warnings

Twenty rules, each derived from an official warning and cited to it: NAPTIP on fake overseas jobs, Kenya's Ministry of Foreign Affairs on Thailand, Cambodia and Myanmar, Uganda's labour ministry on unlicensed brokers, Ghana's employment ministry, the AP investigation into Alabuga Start. Rules are deterministic; there is no "scam score" from a model.

Alongside them, live checks on any domain in the message: when it was registered (a domain younger than 90 days is a caution), whether it receives mail, and whether it looks like a registered agency's domain with one or two characters changed.

## 4. Check the clauses

If the text is an offer letter, six clauses are checked: training or service bonds, probation length and pay, withheld certificates, termination without notice, salary in a foreign currency, and non-compete terms. Each finding cites the Employment Act 2007 (Kenya), the Employment Act 2006 (Uganda), the Labour Act 2003 (Ghana) or the Labour Act Cap L1 (Nigeria), or the leading National Industrial Court decision where Nigeria has no statute. Where a country has no rule on the point, the card says "no cap in statute" rather than inventing one.

## 5. Stamp and reply

The stamp is one of four: **Stop**, **Caution**, **On file**, **Not on file**. There is no "Safe". The strongest positive statement Daju makes is "On file, contact matches, no lure signals found", followed by "still call the number on the register before you pay anything or travel".

The card ends with a reply you can edit and send from WhatsApp, the official hotlines for your country, a one-tap way to report the contact for the next person, and a "for official use" box with the check id and the register snapshot dates.

## What a card cannot tell you

- Direct employers are not agencies and do not appear in agency registers. "Not on file" with no warning signs is normal for a startup hiring directly.
- A register snapshot is as of its date. Kenya's is from May 2026.
- A verified sender can still send a bad contract. Read the clauses.
- None of this is legal advice.
