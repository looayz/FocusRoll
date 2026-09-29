import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Service worker généré : précache tous les fichiers du build (hashés) => hors-ligne réel
    // et mise à jour automatique à chaque déploiement.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // le manifeste est fourni tel quel dans public/manifest.json
      includeAssets: ['manifest.json', 'icon.svg', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
