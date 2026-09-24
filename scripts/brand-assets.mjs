// Renders the brand pack to public/brand as PNGs with the installed Chrome: mark, wordmark, icon, cover, social card, post, story.
// Usage: MSYS_NO_PATHCONV=1 node scripts/brand-assets.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const out = "public/brand";
mkdirSync(out, { recursive: true });

const PAPER = "#f7f6f2";
const TONER = "#121212";
const STAMP = "#5e35a1";
const FIELD = "#4f2d8f";
const INK = "#f4f1ea";
const MARKER = "#fff06a";
const RED = "#b3261e";

const mark = (ink, size) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="13.5" stroke="${ink}" stroke-width="2.4"/>
  <circle cx="16" cy="16" r="9.8" stroke="${ink}" stroke-width="1.1" opacity="0.7"/>
  <path d="M10.5 20.5 14 11.5M18 20.5 21.5 11.5" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>
</svg>`;

const head = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,400..900&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 100%; height: 100%; }
  body { font-family: Archivo, system-ui, sans-serif; color: ${TONER}; -webkit-font-smoothing: antialiased; }
  .wordmark { font-stretch: 82%; font-weight: 800; letter-spacing: 0.02em; line-height: 1; }
  .display { font-stretch: 92%; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
  .condensed { font-stretch: 75%; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 800; }
  .mono { font-family: "Courier Prime", monospace; }
  .hl { background: ${MARKER}; color: ${TONER}; padding: 0 0.12em; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .stamp { display: inline-block; border: 4px solid ${RED}; color: ${RED}; border-radius: 10px; padding: 0.15em 0.5em; transform: rotate(-6deg); font-weight: 900; letter-spacing: 0.1em; }
  .stamp.violet { border-color: ${STAMP}; color: ${STAMP}; }
</style>`;

// Each asset is an HTML document sized to its output; transparent ones omit the background.
const assets = [
  {
    name: "daju-mark-1024",
    w: 1024,
    h: 1024,
    transparent: true,
    html: `<body style="display:flex;align-items:center;justify-content:center;background:transparent">${mark(STAMP, 900)}</body>`,
  },
  {
    name: "daju-mark-white-1024",
    w: 1024,
    h: 1024,
    transparent: true,
    html: `<body style="display:flex;align-items:center;justify-content:center;background:transparent">${mark(INK, 900)}</body>`,
  },
  {
    name: "daju-icon-512",
    w: 512,
    h: 512,
    html: `<body style="display:flex;align-items:center;justify-content:center;background:${STAMP};border-radius:112px">${mark(INK, 380)}</body>`,
  },
  {
    name: "daju-wordmark-light",
    w: 2000,
    h: 640,
    transparent: true,
    html: `<body style="display:flex;align-items:center;justify-content:center;gap:56px;background:transparent">${mark(STAMP, 400)}<span class="wordmark" style="font-size:340px;color:${TONER}">dájú</span></body>`,
  },
  {
    name: "daju-wordmark-dark",
    w: 2000,
    h: 640,
    transparent: true,
    html: `<body style="display:flex;align-items:center;justify-content:center;gap:56px;background:transparent">${mark("#b49be8", 400)}<span class="wordmark" style="font-size:340px;color:#edebe6">dájú</span></body>`,
  },
  {
    name: "daju-cover-1500x500",
    w: 1500,
    h: 500,
    html: `<body style="background:${FIELD};color:${INK};padding:64px 80px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="display:flex;align-items:center;gap:22px">${mark(INK, 84)}<span class="wordmark" style="font-size:72px">dájú</span></div>
        <div class="display" style="font-size:88px;margin-top:34px">Is this sender <span class="hl">on file?</span></div>
        <div style="font-size:26px;margin-top:26px;opacity:.85;max-width:900px">Job-offer checks against the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana.</div>
      </div>
      <div class="mono" style="background:${TONER};color:${INK};padding:26px 30px;border-radius:14px;font-size:22px;line-height:1.5;width:430px">
        <div style="color:#a9a69f;font-size:15px;letter-spacing:.08em">EEMIS · UGANDA</div>
        <div style="margin-top:8px">Moonlight Recruiting Agency</div>
        <div>on file: <span style="color:#7bc79b">+256 702 ••• 113</span></div>
        <div>in message: <span style="color:#f28b82">+256 756 ••• 111</span></div>
        <div style="margin-top:12px"><span class="stamp" style="font-size:20px;border-color:#f28b82;color:#f28b82">STOP</span></div>
      </div>
    </body>`,
  },
  {
    name: "daju-social-1200x630",
    w: 1200,
    h: 630,
    html: `<body style="background:${PAPER};padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:16px">${mark(STAMP, 56)}<span class="wordmark" style="font-size:46px">dájú</span><span class="condensed" style="margin-left:auto;font-size:18px;color:#55534e">Nigeria · Kenya · Uganda · Ghana</span></div>
      <div class="display" style="font-size:96px;max-width:1000px">The company was real.<br/>The person <span class="hl">wasn't.</span></div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between">
        <div style="font-size:26px;color:#55534e;max-width:720px;line-height:1.35">Paste the job message. Daju checks the name, number and email against four government registers and hands you the reply to send.</div>
        <div class="mono" style="font-size:22px;color:${STAMP}">daju-bice.vercel.app</div>
      </div>
    </body>`,
  },
  {
    name: "daju-post-1080x1080",
    w: 1080,
    h: 1080,
    html: `<body style="background:${FIELD};color:${INK};padding:80px;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:16px">${mark(INK, 60)}<span class="wordmark" style="font-size:50px">dájú</span></div>
      <div>
        <div class="condensed" style="font-size:22px;opacity:.8">A real message, checked</div>
        <div class="mono" style="margin-top:22px;background:${TONER};padding:30px 34px;border-radius:16px;font-size:27px;line-height:1.5">"We are agents of <span class="hl">Moonlight Recruiting Agency Uganda Ltd</span>. Pay <span class="hl">medical fee UGX 350,000</span> before processing. WhatsApp <span class="hl">0756 000 111</span> now."</div>
        <div style="margin-top:34px;font-size:40px;line-height:1.25" class="display">Name is on the register.<br/>The number is not.</div>
        <div style="margin-top:18px;font-size:24px;opacity:.85">EEMIS lists +256 702 ••• 113. Licence E26050027, valid to 2028.</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="stamp" style="font-size:44px;border-color:#f28b82;color:#f28b82">STOP</span>
        <span class="mono" style="font-size:24px;opacity:.9">daju-bice.vercel.app</span>
      </div>
    </body>`,
  },
  {
    name: "daju-story-1080x1920",
    w: 1080,
    h: 1920,
    html: `<body style="background:${PAPER};padding:120px 90px;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:18px">${mark(STAMP, 72)}<span class="wordmark" style="font-size:60px">dájú</span></div>
      <div>
        <div class="display" style="font-size:120px;line-height:1.05">Is this sender<br/><span class="hl">on file?</span></div>
        <div style="font-size:36px;margin-top:48px;line-height:1.4;color:#55534e">Forward the job message to Daju. It checks the name, number and email against the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana, then hands you the reply to send.</div>
        <div style="margin-top:56px;display:flex;flex-direction:column;gap:18px;font-size:34px">
          <div><span class="stamp" style="font-size:30px">STOP</span> &nbsp; money before work, wrong number</div>
          <div><span class="stamp violet" style="font-size:30px">ON FILE</span> &nbsp; name and contact match the register</div>
        </div>
      </div>
      <div>
        <div class="condensed" style="font-size:26px;color:${STAMP}">Free · no sign-up · never says "safe"</div>
        <div class="mono" style="font-size:40px;margin-top:18px">daju-bice.vercel.app</div>
      </div>
    </body>`,
  },
];

writeFileSync(join(out, "daju-mark.svg"), mark(STAMP, 512));

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
for (const a of assets) {
  await page.setViewport({ width: a.w, height: a.h, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head>${head}</head>${a.html}</html>`, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: join(out, `${a.name}.png`), omitBackground: !!a.transparent });
  console.log(`${a.name}.png ${a.w}x${a.h}`);
}
await browser.close();
