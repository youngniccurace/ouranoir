// One-off generator for favicons + the social preview image (re-run after branding changes).
// Needs Playwright (npx playwright install chromium) and Python with Pillow for favicon.ico.
//   cd tools && npm run images
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const font = (f) => `data:font/woff2;base64,${readFileSync(join(root, "fonts", f)).toString("base64")}`;
const fontCss = `
  @font-face { font-family: Playball; src: url(${font("playball-latin-400-normal.woff2")}) format("woff2"); }
  @font-face { font-family: "Open Sans"; font-weight: 400; src: url(${font("open-sans-latin-400-normal.woff2")}) format("woff2"); }
  @font-face { font-family: "Open Sans"; font-weight: 700; src: url(${font("open-sans-latin-700-normal.woff2")}) format("woff2"); }
  html, body { margin: 0; }`;

const svg = (f) => readFileSync(join(root, f), "utf8");
const fontFace = (family, file, style = "normal") => `@font-face { font-family: "${family}"; font-style: ${style}; src: url(${font(file)}) format("woff2"); }`;
const fontCss2 = fontCss + fontFace("Playfair Display", "playfair-display-latin-700-normal.woff2") + fontFace("Playfair Display", "playfair-display-latin-700-italic.woff2", "italic");

// Icons are rendered from the logo files built by tools/make-logo.py
const tileHtml = (size, file, { pad = 0, bg = "#0A0F17", radius = 0 } = {}) => `<style>html,body{margin:0}
  .t { width:${size}px; height:${size}px; background:${bg}; border-radius:${radius}%; display:flex; align-items:center; justify-content:center; }
  .t svg { width:${size * (1 - pad)}px; height:${size * (1 - pad)}px; }</style><div class="t">${svg(file)}</div>`;

const ogHtml = `<style>${fontCss2}
  .og { width:1200px; height:630px; box-sizing:border-box; padding:72px 90px; position:relative; overflow:hidden; color:#F4F1EC; font-family:"Open Sans";
        background: radial-gradient(circle at 88% 12%, rgba(212,167,98,.32), transparent 42%), radial-gradient(circle at 6% 100%, rgba(30,155,215,.28), transparent 45%), #0A0F17; }
  .frame { position:absolute; inset:24px; border:1.5px solid rgba(212,167,98,.4); border-radius:28px; }
  .logo svg { height:62px; width:auto; }
  .kicker { margin-top:46px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; font-size:21px; color:#5BBEEB; }
  h1 { margin:14px 0 0; font-family:"Playfair Display"; font-weight:700; font-size:78px; line-height:1.08; letter-spacing:-.01em; }
  h1 em { color:#5BBEEB; }
  .cta { position:absolute; left:90px; bottom:72px; font-weight:700; font-size:24px; color:#C9D1DA; }
  .cta b { color:#D4A762; }
  .mark { position:absolute; right:70px; bottom:60px; width:250px; height:250px; opacity:.95; }
  .mark svg { width:100%; height:100%; }
</style>
<div class="og"><div class="frame"></div>
  <div class="logo">${svg("img/brand/ouranoir-logo-dark.svg")}</div>
  <div class="kicker">Creator Management Agency</div>
  <h1>We grow your audience.<br><em>You keep creating.</em></h1>
  <div class="cta">Creators &middot; Agencies &middot; Careers &middot; <b>Apply in 5 minutes</b></div>
  <div class="mark">${svg("img/brand/ouranoir-mark-dark.svg")}</div>
</div>`;

const browser = await chromium.launch();
async function shot(html, w, h, file, type = "png", quality) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, file), type, quality, omitBackground: type === "png" });
  await page.close();
}
await shot(ogHtml, 1200, 630, "img/og-image.jpg", "jpeg", 82);
await shot(tileHtml(180, "img/brand/ouranoir-mark-dark.svg", { pad: 0.16 }), 180, 180, "img/apple-touch-icon.png"); // iOS rounds corners itself
await shot(tileHtml(192, "img/favicon.svg", { bg: "transparent" }), 192, 192, "img/icon-192.png");
await shot(tileHtml(512, "img/favicon.svg", { bg: "transparent" }), 512, 512, "img/icon-512.png");
await shot(tileHtml(512, "img/brand/ouranoir-mark-dark.svg", { pad: 0.3 }), 512, 512, "img/icon-maskable-512.png");
for (const s of [16, 32, 48]) await shot(tileHtml(s * 4, "img/favicon.svg", { bg: "transparent" }), s * 4, s * 4, `img/.ico-${s}.png`);
// Square PNG exports for social media profile pictures
await shot(tileHtml(1024, "img/brand/ouranoir-mark-dark.svg", { pad: 0.22 }), 1024, 1024, "img/brand/ouranoir-avatar-midnight-1024.png");
await shot(tileHtml(1024, "img/brand/ouranoir-mark-light.svg", { pad: 0.22, bg: "#FFFCF8" }), 1024, 1024, "img/brand/ouranoir-avatar-ivory-1024.png");
await browser.close();

// favicon.ico (16/32/48) via Pillow, then optimise PNGs
execFileSync("python3", ["-c", `
from PIL import Image
import os
root = ${JSON.stringify(root)}
imgs = [Image.open(f"{root}/img/.ico-{s}.png").convert("RGBA").resize((s, s), Image.LANCZOS) for s in (16, 32, 48)]
imgs[2].save(f"{root}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=imgs[:2])
for s in (16, 32, 48): os.remove(f"{root}/img/.ico-{s}.png")
for f in ("apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "brand/ouranoir-avatar-midnight-1024.png", "brand/ouranoir-avatar-ivory-1024.png"):
    p = f"{root}/img/{f}"; im = Image.open(p)
    im = im.convert("RGB") if f in ("apple-touch-icon.png", "icon-maskable-512.png") or f.startswith("brand/") else im
    im.save(p, optimize=True)
`]);
console.log("images written");
