// Builds static assets (run via `npm run build` in tools/):
//  1. self-hosted fonts      -> fonts/*.woff2      (no Google Fonts request, GDPR friendly)
//  2. SVG icon sprite        -> img/icons.svg      (Tabler Icons, only the ones the pages use)
//  3. trimmed Bootstrap CSS  -> css/bootstrap.min.css (unused rules removed with PurgeCSS)
//  4. one render-blocking stylesheet -> css/site.min.css (fonts + bootstrap + style + consent, minified)
//  5. minified scripts       -> js/site.min.js (consent + analytics + main), js/forms.min.js
//     (js/site-config.js stays separate and readable: it holds the IDs you edit)
import { readFileSync, writeFileSync, copyFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PurgeCSS } from "purgecss";
import { transformSync } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const mod = (p) => join(here, "node_modules", p);
const pages = readdirSync(root).filter((f) => f.endsWith(".html")).map((f) => join(root, f));

// 1. Fonts -----------------------------------------------------------------
mkdirSync(join(root, "fonts"), { recursive: true });
const fonts = [
  ["@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2", "plus-jakarta-sans-latin-400-normal.woff2"],
  ["@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2", "plus-jakarta-sans-latin-500-normal.woff2"],
  ["@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2", "plus-jakarta-sans-latin-600-normal.woff2"],
  ["@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2", "plus-jakarta-sans-latin-700-normal.woff2"],
  // Handwritten notes next to calls to action
  ["@fontsource/caveat/files/caveat-latin-600-normal.woff2", "caveat-latin-600-normal.woff2"],
  // Logo, headlines and section titles
  ["@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2", "playfair-display-latin-700-normal.woff2"],
  ["@fontsource/playfair-display/files/playfair-display-latin-700-italic.woff2", "playfair-display-latin-700-italic.woff2"],
];
for (const [src, dest] of fonts) copyFileSync(mod(src), join(root, "fonts", dest));
console.log(`fonts: ${fonts.length} files`);

// 2. Icon sprite (Tabler Icons, outline) ------------------------------------
// Stroke colour/width come from CSS (.icon in css/style.css) so icons follow the theme.
const used = new Set();
for (const file of pages) {
  for (const m of readFileSync(file, "utf8").matchAll(/icons\.svg(?:\?v=[a-f0-9]+)?#(tif?)-([a-z0-9-]+)/g)) used.add(`${m[1]}-${m[2]}`);
}
const symbols = [...used].sort().map((id) => {
  const filled = id.startsWith("tif-");
  const name = id.replace(/^tif?-/, "");
  const svg = readFileSync(mod(`@tabler/icons/icons/${filled ? "filled" : "outline"}/${name}.svg`), "utf8");
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `<symbol id="${id}" viewBox="0 0 24 24">${inner}</symbol>`;
});
writeFileSync(
  join(root, "img/icons.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg"><!-- Tabler Icons (MIT License) https://tabler.io/icons -->${symbols.join("")}</svg>\n`
);
console.log(`icons: ${symbols.length} Tabler symbols`);

// 3. Trim Bootstrap -------------------------------------------------------
const [purged] = await new PurgeCSS().purge({
  content: [...pages, join(root, "js/*.js")],
  css: [join(root, "css/vendor/bootstrap.full.min.css")],
  // classes added by JavaScript or by the server response
  safelist: {
    standard: ["show", "is-invalid", "is-valid", "was-validated", "d-none", "d-block", "visually-hidden"],
    greedy: [/^alert/],
  },
  // keep CSS variables: css/style.css relies on --bs-primary, --bs-dark, --bs-light ...
  variables: false,
});
writeFileSync(join(root, "css/bootstrap.min.css"), purged.css);
const before = readFileSync(join(root, "css/vendor/bootstrap.full.min.css")).length;
console.log(`bootstrap css: ${Math.round(before / 1024)}KB -> ${Math.round(purged.css.length / 1024)}KB`);

// 4. Bundle + minify the stylesheets every page needs into a single request ----
const minify = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};:,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();
const bundle = ["css/fonts.css", "css/bootstrap.min.css", "css/style.css", "css/consent.css"]
  .map((f) => readFileSync(join(root, f), "utf8"))
  .join("\n");
writeFileSync(join(root, "css/site.min.css"), minify(bundle) + "\n");
console.log(`site.min.css: ${Math.round(readFileSync(join(root, "css/site.min.css")).length / 1024)}KB (1 request instead of 4)`);

// 5. Minify scripts ------------------------------------------------------------
const js = (files) => files.map((f) => transformSync(readFileSync(join(root, f), "utf8"), { minify: true, target: "es2018" }).code).join("\n");
writeFileSync(join(root, "js/site.min.js"), js(["js/consent.js", "js/analytics.js", "js/main.js"]));
writeFileSync(join(root, "js/forms.min.js"), js(["js/forms.js"]));
console.log(`site.min.js: ${Math.round(readFileSync(join(root, "js/site.min.js")).length / 1024)}KB, forms.min.js: ${Math.round(readFileSync(join(root, "js/forms.min.js")).length / 1024)}KB`);
