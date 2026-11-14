import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
plugins: [tailwindcss(), react()],
define: { 'import.meta.env.VITE_STATIC_EXPORT': 'true' },
resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
build: { outDir: 'dist', emptyOutDir: true },
});
