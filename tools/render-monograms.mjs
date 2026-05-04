#!/usr/bin/env node
// Render per-addon monograms from logo-variants.html.
// Output: design-handoff/images/wick-logo-{addon}-{256,512}.png

import path from "node:path";
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "file:///C:/Users/jspli/Projects/Wick/WickSuite/logo-variants.html";
const OUT = "C:/Users/jspli/Projects/Wick/design-handoff/images";

const TILES = [
  { id: "wick-logo-qk-256",     out: "wick-logo-qk-256.png",    w: 256, h: 256 },
  { id: "wick-logo-qk-512",     out: "wick-logo-qk-512.png",    w: 512, h: 512 },
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
    const dest = path.join(OUT, t.out);
    await el.screenshot({ path: dest });
    console.log(`✓ ${t.out}`);
  }
} finally {
  await browser.close();
}
