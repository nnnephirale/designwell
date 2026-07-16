import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the static build works at any GitHub Pages path
export default defineConfig({
  plugins: [react()],
  base: './',
  // honor the harness-assigned PORT so the preview panel's autoPort works
  server: { port: Number(process.env.PORT) || 5183 },
})
