import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Esoterica OS',
        short_name: 'Esoterica',
        description: 'Mystical altar and occult system',
        theme_color: '#0b0b14',
        background_color: '#0b0b14',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@react-three/drei')) return 'drei-core';
          if (id.includes('@react-three/fiber')) return 'r3f-core';
          if (id.includes('three/examples') || id.includes('three-stdlib')) return 'three-examples';
          if (id.includes('three')) return 'three-core';
          if (id.includes('d3')) return 'graph-core';
          if (id.includes('framer-motion')) return 'motion-core';
          if (id.includes('@supabase')) return 'supabase-core';
          if (id.includes('react-hot-toast')) return 'toast-core';
          if (id.includes('lucide-react')) return 'icons-core';
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
  }
});