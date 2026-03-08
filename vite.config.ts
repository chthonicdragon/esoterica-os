import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('@react-three/drei')) {
            return 'vendor-drei'
          }

          if (id.includes('@react-three/fiber')) {
            return 'vendor-r3f'
          }

          if (id.includes('/three/examples/')) {
            return 'vendor-three-examples'
          }

          if (id.includes('/three/')) {
            return 'vendor-three-core'
          }

          if (id.includes('d3')) {
            return 'vendor-d3'
          }

          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }

          if (id.includes('@radix-ui')) {
            return 'vendor-radix'
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }

          if (id.includes('date-fns')) {
            return 'vendor-date'
          }

          if (id.includes('react-hot-toast') || id.includes('sonner')) {
            return 'vendor-notify'
          }

          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 3000,
    // позволяем Vite автоматически выбирать следующий свободный порт (3001, 3002, …),
    // чтобы не падать, если 3000 занят другим процессом
    strictPort: false,
    host: true,
    allowedHosts: true,
    proxy: {
      '/_openrouter': {
        target: 'https://openrouter.ai/api/v1',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_openrouter/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const siteUrl = process.env.VITE_SITE_URL?.trim() || 'https://esoterica-os.vercel.app'
            const siteTitle = process.env.VITE_SITE_TITLE?.trim() || 'Esoterica OS'
            const apiKey = process.env.VITE_OPENROUTER_API_KEY?.trim() || ''
            if (apiKey) proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
            proxyReq.setHeader('HTTP-Referer', siteUrl)
            proxyReq.setHeader('X-Title', siteTitle)
          })
        },
      },
      '/_groq': {
        target: 'https://api.groq.com/openai/v1',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_groq/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const apiKey = process.env.VITE_GROQ_API_KEY?.trim() || ''
            if (apiKey) proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
          })
        },
      },
    },
  }
});
