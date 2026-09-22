# Data sources and limits

## Registers

| Country | Source | What it holds | Snapshot | Caveat |
|---|---|---|---|---|
| Nigeria | NELEX, Federal Ministry of Labour and Employment: registered private employment agencies | Name, email, CAC-verified flag, active flag | 2026-09-21 | No phone numbers, licence numbers or expiry dates. Large HR firms that are not registered as private employment agencies are absent. |
| Kenya | National Employment Authority register, served by the State Department for Diaspora Affairs | Licence number, name, email, website, valid or expired | 2026-05-18 | The NEA portal blocks connections from outside Kenya; the diaspora mirror was last updated in May 2026. No phones. |
| Uganda | EEMIS, Ministry of Gender, Labour and Social Development: licensed external recruitment companies | Name, phone, email, address, licence validity | 2026-09-21 | Lists currently licensed firms only; revoked companies do not appear. |
| Ghana | GLMIS, Ministry of Employment and Labour Relations: employment agencies directory | Name, type, email, location | 2026-09-21 | No licence status. The Ministry announced a licensed-agency list on 8 September 2026; this snapshot should be replaced by it. |

Because only Uganda publishes phone numbers, a WhatsApp number in a Nigerian, Kenyan or Ghanaian message can only be compared when the register also lists an email or domain the message uses. The card says this explicitly and shows the contact on file.

## Law

Citations were checked against the official text of the Employment Act 2007 (Kenya), Employment Act 2006 (Uganda), Labour Act 2003, Act 651 (Ghana) and the Labour Act Cap L1 LFN 2004 (Nigeria), plus named National Industrial Court of Nigeria decisions where Nigeria has no statute (training bonds: Dangote Oil Refining v Isah; withheld certificates: Onah v Embassy Pharmaceutical). Where no statute or fetchable judgment exists, the entry is marked and the card says so. Verified 2026-09-21.

## Warnings behind the lure rules

Seven official sources, quoted verbatim in `data/law/lure_sources.json`: Kenya's government warning on Thailand customer-care jobs (2022), Kenya's Foreign Affairs Cabinet Secretary to the Senate on Myanmar and Cambodia (May 2026), NAPTIP on fake overseas jobs and fraud factories (July 2026), Uganda's labour ministry on unlicensed brokers (April 2026), Ghana's employment ministry announcements (July and September 2026), and the Associated Press investigation into Alabuga Start.

## Hotlines

Every number on the site links to the official page it was taken from. Numbers that could not be verified on an official page are marked unverified and hidden from cards.

## What Daju does not know

- Whether a company that is not an agency exists. Company registers (CAC in Nigeria, BRS in Kenya, URSB in Uganda, ORC in Ghana) are not connected yet.
- Whether a person on LinkedIn is who they say they are.
- Anything about an offer that happened by voice call with no text.
- Whether a licensed agency with a matching number is honest. Licensed is not the same as safe, which is why the card never says safe.
