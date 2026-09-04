import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/MrDrawing/',
  server: { port: 5173, proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } }
})
