// Screenshots every route in both themes at desktop and phone widths, using the installed Chrome.
// Usage: node scripts/shots.mjs [baseUrl] [outDir]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] || "http://localhost:3011";
const out = process.argv[3] || "shots";
const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const clean = (s) => s.split(",").map((r) => r.trim()).filter(Boolean);
const routes = clean(process.env.SHOT_ROUTES || "/,/check,/registry?q=moonlight,/employers,/report,/hotlines,/method,/brand");
const extra = process.env.SHOT_EXTRA ? clean(process.env.SHOT_EXTRA) : [];

mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const sizes = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };

for (const route of [...routes, ...extra]) {
  const slug = route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-") || "home";
  for (const [sizeName, vp] of Object.entries(sizes)) {
    for (const scheme of ["light", "dark"]) {
      await page.setViewport(vp);
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
      await page.goto(base + route, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 900));
      const file = join(out, `${slug}--${sizeName}--${scheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(file, overflow > 0 ? `HORIZONTAL OVERFLOW ${overflow}px` : "ok");
    }
  }
}
await browser.close();
