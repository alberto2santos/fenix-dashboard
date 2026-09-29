// ============================================================
// vite.config.ts
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['fenix-icon.svg', 'favicon.ico'],
      manifest: {
        name: 'Fênix II — Dashboard de Soldagem',
        short_name: 'Fênix II',
        description: 'Monitoramento de produção de soldagem por área.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/fenix-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],

  resolve: {
    alias: {
      // Deve espelhar o "paths" do tsconfig.app.json
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/zrender/')) return 'zrender'
          if (id.includes('/node_modules/echarts/')) return 'echarts'
        },
      },
    },
  },
})
