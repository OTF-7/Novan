import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://novanwater.com",
  compressHTML: true,
  build: {
    /* keep all CSS external so the CSP never needs style-src 'unsafe-inline' */
    inlineStylesheets: "never",
  },
  vite: {
    preview: {
      allowedHosts: ["novan.omartaha.net", "novanwater.com", "www.novanwater.com"],
    },
  },
});
