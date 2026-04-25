import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@seestack/shared': resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3002,
    strictPort: true,
    proxy: {
      '/api/v1/logs/tail': {
        target: 'ws://localhost:8082',
        ws: true,
      },
      '/api/v1/chat/ws': {
        target: 'ws://localhost:8082',
        ws: true,
      },
      '/api/v1/ssh/terminal': {
        target: 'ws://localhost:8082',
        ws: true,
      },
      '/api': 'http://localhost:8082',
      '/ingest': 'http://localhost:8082',
      '/webhooks': 'http://localhost:8082',
      '/ws': {
        target: 'ws://localhost:8082',
        ws: true,
      },
    },
  },
})
