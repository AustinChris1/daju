# Design

World chosen by the owner on 2026-09-21: **photocopy and stamp pad**, fused with the assigned grounded direction (seed d7b70bf5, index 7 of the audience-world list: the commissioner-for-oaths desk, where a sworn document is numbered paragraph by paragraph and only earns its seal at the end).

## The world

A certified true copy at a Lagos photocopy shop. Stark photocopy white, toner black, the violet of a stamp pad, and a yellow highlighter run across the line that matters. The report card is the document: numbered paragraphs of findings, a ruled "for official use" box carrying the register snapshot dates, and a stamp impression that lands last and says what the document is.

Physical scene that fixed light mode: a job seeker on a phone, in a WhatsApp group, often at night. A photocopy is white; dark mode is the carbon copy (near-black ground, violet ink lightened, highlighter dimmed to mustard) and follows the system setting.

## Raises taken from the dealt challengers

- **State is a mark, not a hue** (from the cutting-bench rail, declined): verdicts are stamp impressions, strike-throughs and ticks. Colour confirms, it never carries alone.
- **Every card addressable, reply editable in place** (from the HyperCard stack, declined): each check has a permanent URL; the ready-to-send reply is a textarea the user edits before copying.
- **One large object per viewport** (from the console void, declined): the stamp is the only big element on the card; everything else is 15 to 16px document text.
- **One action colour** (from the hardware bench, competitive on clarity): stamp violet is reserved for the single primary action on any screen and for the impression itself.
- **Words as the object** (from the alphabet storm, declined): matched phrases are highlighted inside the user's own pasted text, not repeated in a separate list.
- **Labels name the obvious** (from the industrial quote grammar, competitive on identification): section labels are literal: "What was found", "Who is on file", "What to send".

## Mark and wordmark

The tone seal: the two acute high-tone marks of dájú inside a double-ring stamp, drawn in stamp violet, stroke-based, legible at 16px. The wordmark is the word with its tones, dájú, in Archivo 800 at width 82. The earlier page-and-seal mark stays on `/brand` as a considered direction.

## Tokens

- Ground: `--paper #F7F6F2`, `--paper-2 #EFEDE7` (light); `--paper #141416`, `--paper-2 #1C1C20` (dark)
- Ink: `--toner #121212` / dark `#EDEBE6`; `--toner-2 #55534E` / dark `#A9A69F`; rules `--rule #CFCCC4` / dark `#33333A`
- Stamp: `--stamp #5E35A1` (hover `#4B2A84`) / dark `#B49BE8`
- Highlighter: `--mark #FFF06A` / dark `#C9B93A` with toner text
- Red ink (stop only): `--red #B3261E` / dark `#F28B82`; pencil amber (caution): `--amber #8A5A00` / dark `#E3B341`; grey stamp (not on file): toner-2

Colour strategy (revised 2026-09-22 at the owner's request, the paper-and-rules version read as dry): committed. Deep violet (#4f2d8f) owns the hero, the employer panel and the closing band; the highlighter yellow is the primary action colour on violet and the accent on the dark proof band (#171528). Photographs run in full colour. Cards are rounded 14 to 16px with soft offset shadows; 1px rules stay only in ledgers and tables. Navigation is a pill row with a filled active pill, no underlines. Every clickable element shows the pointer cursor.

## Type

- Display and UI: Archivo variable (width axis). Stamps and section labels: uppercase, width 75, weight 800, tracking 0.06em. Headings: width 90 to 100, weight 700, tracking -0.02em. Body: 16px, weight 400, measure 68ch max.
- Evidence and quoted text: Courier Prime (the typed original). Numbers in tables: Archivo tabular figures.

## Composition and topology

- One document column, 72ch max, ruled by 1px lines. Navigation is a row of index-divider tabs at the top of every page.
- Paragraphs are numbered like an affidavit ("1.", "2.") when they are findings.
- The "For official use" box: register snapshot dates, engine version, check id, in Courier Prime.
- Cards: none nested; one sheet per screen. Radius 4px on the sheet, 2px on controls (a photocopy has square corners).
- Shadows: the sheet carries one offset shadow (0 12px 32px -18px toner at 35%), nothing else casts.

## Controls and state

- Primary button: violet fill, paper text, square corners, uppercase condensed label. Secondary: toner outline. Disabled: dotted outline, toner-2 text.
- Inputs: paper-2 fill, 1px rule, violet 2px focus ring offset 2px. Caret and selection violet.
- Verdict stamp: rotated -6deg, double-ring border 3px, uppercase condensed 800, slight ink bleed (text-shadow 0 0 1px) and a 1px inner ring. Stop = red ink; caution = amber; on file = violet; not on file = toner-2.
- Struck-through lines for findings the user dismisses; ticks for hotline items copied.
- Loading: the sheet shows a moving grey scan bar (photocopier lamp) across the input; no spinners.
- Empty: the paper is blank with a single ruled prompt line.

## Motion

One authored moment: the stamp impression. Scale 1.35 to 1, rotate -14deg to -6deg, blur 3px to 0, opacity 0 to 1, 420ms exponential ease-out, then the highlighter sweeps left to right across matched phrases (clip-path inset, 260ms, staggered 40ms). Everything else is 120ms opacity or none. Respects prefers-reduced-motion by skipping to the final frame.

## Browser surfaces

Selection violet at 25% with toner text; caret violet; focus ring violet double; thin scrollbar with toner-2 thumb on paper-2; underline offset 3px; tabular numerals in every table.
