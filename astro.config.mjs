// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  build: {
    inlineStylesheets: "always",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [react()]
});