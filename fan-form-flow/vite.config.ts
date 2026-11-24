import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";
import { createHash } from "crypto";

// Version the shared logo sprite (../img/logo.svg) so a new logo shows despite long-term caching
const LOGO_VERSION = createHash("sha1").update(readFileSync(path.resolve(__dirname, "../img/logo.svg"))).digest("hex").slice(0, 10);

// Tags that point at files owned by the main OuraNoir site (../favicon.ico, ../js/consent.js ...).
// Injected after Vite's asset handling so they are NOT copied into apply/assets.
const sharedSiteHead = () => ({
  name: "ouranoir-shared-head",
  transformIndexHtml: {
    order: "post" as const,
    handler: (html: string) =>
      html
        .replace("</head>", readFileSync(path.resolve(__dirname, "shared-head.html"), "utf8") + "  </head>")
        .replaceAll("../img/logo.svg#", `../img/logo.svg?v=${LOGO_VERSION}#`),
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: { __LOGO_VERSION__: JSON.stringify(LOGO_VERSION) },
  // Relative asset paths so the built app works from the /apply/ folder
  // of the OuraNoir site (or any other sub-folder).
  base: "./",
  build: {
    // Build straight into the main site: ouranoir/apply/
    outDir: "../apply",
    emptyOutDir: true,
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    sharedSiteHead(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
