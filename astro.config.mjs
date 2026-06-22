// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: "https://uplg.xyz",
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    server: {
      // Dev-only proxy to the Hora status API. The browser hits a same-origin
      // path (no CORS); Vite forwards it server-side to the live instance, whose
      // CORS allowlist only admits https://uplg.xyz in production. Not used in
      // the build — production fetches the absolute URL directly.
      proxy: {
        "/__hora": {
          target: "https://status.uplg.xyz",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__hora/, ""),
        },
      },
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/404"),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", fr: "fr" },
      },
    }),
  ],
});