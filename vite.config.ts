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
    strictPort: true,
    host: true,
    allowedHosts: true,
  }
});