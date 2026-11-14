import { defineConfig } from '@lovable.dev/vite-tanstack-config';
export default defineConfig({
  base: '/AdegaPrevisao/', // 👈 Essencial para gerar os caminhos corretos no GitHub Pages
  plugins: [react()],
// Lovable preview and hosting retain the supported Start bootstrap.
// GitHub Pages uses the independent, browser-only vite.static.config.ts target.

