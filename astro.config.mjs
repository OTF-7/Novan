import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://novanwater.com",
  compressHTML: true,
  build: {
    /* keep all CSS external so the CSP never needs style-src 'unsafe-inline' */
    inlineStylesheets: "never",
  },
  /* astro preview builds its own Vite config (configFile: false) and only
     reads the top-level `server` option — vite.preview.* is ignored */
  server: {
    allowedHosts: ["novan.omartaha.net", "novanwater.com", "www.novanwater.com"],
  },
});
