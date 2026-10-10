// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static site. Cloudflare Workers serves `dist` as assets (see wrangler.jsonc).
export default defineConfig({
  output: 'static',
  redirects: {
    '/events/northside-summer-stroll': '/events/2026-summer-stroll',
    '/brand': '/member/brand',
    '/add-a-business': '/member/add-a-business',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
