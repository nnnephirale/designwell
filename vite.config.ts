import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single self-contained index.html: JS, CSS and fonts (base64) all inlined, so
// the built file opens straight from disk (file://) with no server — and still
// deploys to GitHub Pages as one file. base './' keeps asset paths relative.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    // inline every asset (fonts are ~50-80kb each) into the single bundle
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
  },
  // honor the harness-assigned PORT so the preview panel's autoPort works
  server: { port: Number(process.env.PORT) || 5183 },
})
