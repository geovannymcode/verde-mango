import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

const analyze = process.env.ANALYZE === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(analyze
      ? [
          visualizer({
            filename: 'coverage/bundle/stats.html',
            template: 'treemap',
            sourcemap: true,
          }),
          visualizer({
            filename: 'coverage/bundle/stats.json',
            template: 'raw-data',
            sourcemap: true,
          }),
        ]
      : []),
  ],
  // Audit only: hidden maps let the visualizer attribute the minified output to modules.
  build: { sourcemap: analyze ? 'hidden' : false, manifest: analyze },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
      '/actuator': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
