import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'assets/logo.jpg'],
      manifest: {
        name: 'Resume Builder',
        short_name: 'Resume',
        description: 'ATS-friendly resume builder for students. Works offline; data stays in your browser.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f6f5f2',
        theme_color: '#8b1a1a',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,jpg,woff,woff2}'] },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
