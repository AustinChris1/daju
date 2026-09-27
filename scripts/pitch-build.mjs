// Builds the pitch deck from pitch/slides into a standalone HTML page and a PDF, with repo images and lucide icons.
// Usage: MSYS_NO_PATHCONV=1 node scripts/pitch-build.mjs
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Lucide from "lucide-react";
import puppeteer from "puppeteer-core";

const dir = resolve("pitch");
const deck = JSON.parse(readFileSync(join(dir, "deck.json"), "utf8"));

// Uploaded deck assets map back to the files they came from in this repo.
const IMAGES = {
  "/_blob/02a49257d6341f2881124b90d27e8817": "../public/images/lagos-phones.jpg",
  "/_blob/13e17e60a4430858572ba8713176476a": "../public/images/app-card.png",
  "/_blob/60bd1665a141da368c047590ebce9bba": "../public/brand/daju-mark-white-1024.png",
  "/_blob/e86b7cf4324a779e518fcffeac2b1438": "../public/images/app-radar.png",
  "/_blob/d3bc655dbcea652b4c6fcd88ed24ce07": "../public/images/app-registers.png",
  "/_blob/dbcb25f8a29cdacbbba431d66ecd82c0": "../public/brand/daju-mark-1024.png",
};
const ICONS = { Activity: "Activity", Chat: "MessageCircle", Clock: "Clock", Code: "Code", Database: "Database", Globe: "Globe", Key: "Key", PaperPlane: "Send", Search: "Search", Warning: "TriangleAlert" };

function icon(name, style) {
  const Comp = Lucide[ICONS[name] ?? name];
  if (!Comp) throw new Error(`No lucide icon for ${name}`);
  const color = /color:\s*([^;]+)/.exec(style)?.[1]?.trim() ?? "currentColor";
  const size = parseInt(/width:\s*(\d+)/.exec(style)?.[1] ?? "48", 10);
  return renderToStaticMarkup(createElement(Comp, { size, color, strokeWidth: 2, "aria-hidden": true }));
}

const slides = deck.order.map((id) => {
  let html = readFileSync(join(dir, "slides", `${id}.html`), "utf8");
  for (const [blob, file] of Object.entries(IMAGES)) html = html.replaceAll(blob, file);
  html = html.replace(/<x-icon name="([A-Za-z]+)" style="([^"]*)"><\/x-icon>/g, (_, n, s) => icon(n, s));
  return html;
});

const fonts = Object.values(deck.faces).map((f) => `<link rel="stylesheet" href="${f.href}">`).join("\n");
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${deck.title}</title>
${fonts}
<style>
  @page { size: 1920px 1080px; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  html, body { background: #2a2733; }
  body { padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 40px; }
  section { position: relative; width: 1920px; height: 1080px; overflow: hidden; display: flex; flex-direction: column; flex-shrink: 0; }
  section > aside { display: none; }
  h1, h2, h3, p { font-weight: inherit; }
  ul, ol { padding-left: 1.1em; }
  li + li { margin-top: 0.3em; }
  b { font-weight: 800; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 0.85em; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #55534e; padding: 18px 20px; border-bottom: 2px solid #121212; }
  td { padding: 20px; border-bottom: 1px solid #d8d4cb; vertical-align: top; }
  svg { flex-shrink: 0; }
  @media print {
    html, body { background: none; padding: 0; gap: 0; display: block; }
    section { page-break-after: always; break-after: page; }
  }
</style>
</head>
<body>
${slides.join("\n")}
</body>
</html>
`;
const htmlPath = join(dir, "daju-pitch.html");
writeFileSync(htmlPath, page);

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
const tab = await browser.newPage();
await tab.setViewport({ width: 1920, height: 1080 });
await tab.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0", timeout: 90000 });
await tab.evaluate(() => document.fonts.ready);
const pdfPath = join(dir, "daju-pitch.pdf");
await tab.pdf({ path: pdfPath, width: "1920px", height: "1080px", printBackground: true, pageRanges: "" });
await browser.close();
copyFileSync(pdfPath, resolve("public", "daju-pitch.pdf"));
console.log(`built ${slides.length} slides: pitch/daju-pitch.html, pitch/daju-pitch.pdf, public/daju-pitch.pdf`);
