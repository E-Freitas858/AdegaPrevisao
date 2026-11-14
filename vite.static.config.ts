import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Ou o pacote correspondente à sua versão do Tailwind

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Certifique-se de que ele está sendo chamado nos plugins se essa for a sua estrutura
  ],
  // ... restante das suas configurações existentes
})
