import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(), 
    viteSingleFile(),
    {
      name: 'no-attribute',
      transformIndexHtml(html) {
        return html.replace(/type="module"/g, 'defer').replace(/crossorigin/g, '');
      }
    }
  ],
  build: {
    target: 'es2015',
    cssTarget: 'chrome61', 
  }
})
