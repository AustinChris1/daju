# Daju pitch deck

13 slides for the StacStart Borderless Bytes 2026 judges.

- `daju-pitch.pdf`: the deck as a PDF, 1920 by 1080. Also served at https://usedaju.vercel.app/daju-pitch.pdf.
- `daju-pitch.html`: the same deck as one page; open it in a browser.
- `slides/` and `deck.json`: the source of each slide and the slide order.

Rebuild after editing a slide:

```bash
MSYS_NO_PATHCONV=1 node scripts/pitch-build.mjs
```

Every figure comes from the repository or the live service as of 27 September 2026: register counts and snapshot dates from `data/registries/`, the weekly diff from `data/registries/changes.json`, statistics with their sources from the landing page.
