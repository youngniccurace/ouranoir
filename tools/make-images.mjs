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

// Monogram icon. `pad` shrinks the art for maskable icons (safe zone = inner 80%).
const iconHtml = (size, { pad = 0, radius = 0.22 } = {}) => `<style>${fontCss}
  .bg { width:${size}px; height:${size}px; background:#050709; border-radius:${radius * 100}%; display:flex; align-items:center; justify-content:center; }
  .ring { width:${size * (0.78 - pad)}px; height:${size * (0.78 - pad)}px; border:${Math.max(1.5, size * 0.035)}px solid #D4A762; border-radius:50%; display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
  .t { font-family:Playball; color:#D4A762; font-size:${size * (0.42 - pad * 0.5)}px; line-height:1; transform:translateY(-3%); }
</style><div class="bg"><div class="ring"><span class="t">ON</span></div></div>`;

const ogHtml = `<style>${fontCss}
  .og { width:1200px; height:630px; box-sizing:border-box; padding:80px 90px; background:#050709;
        background-image: radial-gradient(circle at 85% 15%, rgba(212,167,98,.35), transparent 45%), radial-gradient(circle at 10% 95%, rgba(212,167,98,.18), transparent 40%);
        color:#fff; font-family:"Open Sans"; position:relative; overflow:hidden; }
  .frame { position:absolute; inset:24px; border:2px solid rgba(212,167,98,.45); border-radius:28px; }
  .logo { font-family:Playball; font-size:64px; color:#D4A762; } .logo span { color:#fff; }
  .kicker { margin-top:34px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; font-size:22px; color:#D4A762; }
  h1 { margin:14px 0 0; font-family:Playball; font-weight:400; font-size:96px; line-height:1.1; }
  h1 em { font-style:normal; color:#D4A762; }
  .cta { position:absolute; left:90px; bottom:80px; font-weight:700; font-size:26px; color:#e9e6e1; }
  .mono { position:absolute; right:100px; top:70px; width:170px; height:170px; border:4px solid #D4A762; border-radius:50%;
          display:flex; align-items:center; justify-content:center; font-family:Playball; font-size:80px; color:#D4A762; }
</style>
<div class="og"><div class="frame"></div>
  <div class="logo">Oura<span>Noir</span></div>
  <div class="kicker">OnlyFans Management Agency</div>
  <h1>You Create.<br><em>We Grow</em> Your Brand.</h1>
  <div class="cta">Confidential &middot; 18+ only &middot; Apply in 5 minutes</div>
  <div class="mono">ON</div>
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
await shot(iconHtml(180, { radius: 0 }), 180, 180, "img/apple-touch-icon.png"); // iOS rounds corners itself
await shot(iconHtml(192), 192, 192, "img/icon-192.png");
await shot(iconHtml(512), 512, 512, "img/icon-512.png");
await shot(iconHtml(512, { pad: 0.14, radius: 0 }), 512, 512, "img/icon-maskable-512.png");
for (const s of [16, 32, 48]) await shot(iconHtml(s * 4), s * 4, s * 4, `img/.ico-${s}.png`);
await browser.close();

// favicon.ico (16/32/48) via Pillow, then optimise PNGs
execFileSync("python3", ["-c", `
from PIL import Image
import os
root = ${JSON.stringify(root)}
imgs = [Image.open(f"{root}/img/.ico-{s}.png").convert("RGBA").resize((s, s), Image.LANCZOS) for s in (16, 32, 48)]
imgs[2].save(f"{root}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=imgs[:2])
for s in (16, 32, 48): os.remove(f"{root}/img/.ico-{s}.png")
for f in ("apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"):
    p = f"{root}/img/{f}"; im = Image.open(p)
    im = im.convert("RGB") if f in ("apple-touch-icon.png", "icon-maskable-512.png") else im
    im.save(p, optimize=True)
`]);
console.log("images written");
