// Captures real screens of the live app at phone size for the landing page: a card, the registers page, the radar.
// Usage: MSYS_NO_PATHCONV=1 node scripts/app-shots.mjs [baseUrl]
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";

const base = (process.argv[2] || "https://daju-bice.vercel.app").replace(/\/$/, "");
const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync("public/images", { recursive: true });

// The Uganda case: a licensed name with the wrong number. Run it live so the card carries today's snapshot dates.
const src = readFileSync("src/lib/samples.ts", "utf8");
const m = /id: "uganda-gulf"[\s\S]*?country: "([A-Z]{2})",[\s\S]*?text: `([\s\S]*?)`/.exec(src);
const res = await fetch(`${base}/api/check`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: m[2], country: m[1] }) });
const { report } = await res.json();
console.log("card", report.id, report.verdict.level);

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

const shots = [
  { name: "app-card", url: `${base}/c/${report.id}`, scroll: 0 },
  { name: "app-registers", url: `${base}/registry`, scroll: 300 },
  { name: "app-radar", url: `${base}/radar`, scroll: 0 },
];
for (const s of shots) {
  await page.goto(s.url, { waitUntil: "networkidle0", timeout: 90000 });
  await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
  await new Promise((r) => setTimeout(r, 1800));
  // Hide the dev overlay badge if present and freeze reveals so nothing is mid-transition.
  await page.addStyleTag({ content: "nextjs-portal{display:none}.reveal{opacity:1!important;clip-path:none!important;transform:none!important}" });
  await page.screenshot({ path: `public/images/${s.name}.png` });
  console.log(`${s.name}.png`);
}
await browser.close();
