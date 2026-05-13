#!/usr/bin/env node
// Render per-addon monograms from logo-variants.html.
// Output: WickSuite/images/{slug}/logo-{256,512}.png

import path from "node:path";
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "file:///C:/Users/jspli/Projects/Wick/WickSuite/logo-variants.html";
const OUT = "C:/Users/jspli/Projects/Wick/WickSuite/images";

const TILES = [
  { id: "wick-logo-qk-256",     slug: "questkey", out: "logo-256.png", w: 256, h: 256 },
  { id: "wick-logo-qk-512",     slug: "questkey", out: "logo-512.png", w: 512, h: 512 },
  { id: "wick-logo-layers-256", slug: "layers",   out: "logo-256.png", w: 256, h: 256 },
  { id: "wick-logo-layers-512", slug: "layers",   out: "logo-512.png", w: 512, h: 512 },
  { id: "wick-logo-tt-256",     slug: "totems",    out: "logo-256.png", w: 256, h: 256 },
  { id: "wick-logo-tt-512",     slug: "totems",    out: "logo-512.png", w: 512, h: 512 },
  { id: "wick-logo-wd-256",     slug: "wardrobe",  out: "logo-256.png", w: 256, h: 256 },
  { id: "wick-logo-wd-512",     slug: "wardrobe",  out: "logo-512.png", w: 512, h: 512 },
  { id: "wick-logo-le-256",     slug: "ledger",    out: "logo-256.png", w: 256, h: 256 },
  { id: "wick-logo-le-512",     slug: "ledger",    out: "logo-512.png", w: 512, h: 512 },
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--allow-file-access-from-files"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1600, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 800));

  for (const t of TILES) {
    const el = await page.$(`#${t.id}`);
    if (!el) { console.error(`! tile not found: #${t.id}`); continue; }
    const destDir = path.join(OUT, t.slug);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, t.out);
    await el.screenshot({ path: dest });
    console.log(`✓ ${t.slug}/${t.out}`);
  }
} finally {
  await browser.close();
}
