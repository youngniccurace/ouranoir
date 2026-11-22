// Builds static assets (run via `npm run build` in tools/):
//  1. self-hosted fonts      -> fonts/*.woff2      (no Google Fonts request, GDPR friendly)
//  2. SVG icon sprite        -> img/icons.svg      (only the icons the pages use, instead of a 150KB+ icon font)
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
  ["@fontsource/open-sans/files/open-sans-latin-400-normal.woff2", "open-sans-latin-400-normal.woff2"],
  ["@fontsource/open-sans/files/open-sans-latin-600-normal.woff2", "open-sans-latin-600-normal.woff2"],
  ["@fontsource/open-sans/files/open-sans-latin-700-normal.woff2", "open-sans-latin-700-normal.woff2"],
  ["@fontsource/playball/files/playball-latin-400-normal.woff2", "playball-latin-400-normal.woff2"],
];
for (const [src, dest] of fonts) copyFileSync(mod(src), join(root, "fonts", dest));
console.log(`fonts: ${fonts.length} files`);

// 2. Icon sprite ----------------------------------------------------------
const used = new Set();
for (const file of pages) {
  for (const m of readFileSync(file, "utf8").matchAll(/icons\.svg#(fas|fab)-([a-z0-9-]+)/g)) used.add(`${m[1]}-${m[2]}`);
}
const symbols = [...used].sort().map((id) => {
  const [style, ...rest] = id.split("-");
  const name = rest.join("-");
  const svg = readFileSync(mod(`@fortawesome/fontawesome-free/svgs/${style === "fab" ? "brands" : "solid"}/${name}.svg`), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<!--[\s\S]*?-->/g, "");
  return `<symbol id="${id}" viewBox="${viewBox}">${inner}</symbol>`;
});
writeFileSync(
  join(root, "img/icons.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0) -->${symbols.join("")}</svg>\n`
);
console.log(`icons: ${symbols.length} symbols`);

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
