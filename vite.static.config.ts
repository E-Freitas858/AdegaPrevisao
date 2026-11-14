import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O restante da sua configuração continua daqui para baixo
export default defineConfig({

  base: './',
plugins: [tailwindcss(), react()],
define: { 'import.meta.env.VITE_STATIC_EXPORT': 'true' },
resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
build: { outDir: 'dist', emptyOutDir: true },
});
