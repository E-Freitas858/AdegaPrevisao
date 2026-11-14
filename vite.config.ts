import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/AdegaPrevisao/', // ATENÇÃO: Use o nome exato do seu repositório aqui
});
