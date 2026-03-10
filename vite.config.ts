import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const SITE_URL = env.VITE_SITE_URL?.trim() || 'https://esoterica-os.vercel.app';
  const SITE_TITLE = env.VITE_SITE_TITLE?.trim() || 'Esoterica OS';
  const OPENROUTER_KEY = env.VITE_OPENROUTER_API_KEY?.trim() || '';
  const GROQ_KEY = env.VITE_GROQ_API_KEY?.trim() || '';

  return {
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
              if (OPENROUTER_KEY) proxyReq.setHeader('Authorization', `Bearer ${OPENROUTER_KEY}`);
              proxyReq.setHeader('HTTP-Referer', SITE_URL);
              proxyReq.setHeader('X-Title', SITE_TITLE);
            });
          },
        },
        '/_groq': {
          target: 'https://api.groq.com/openai/v1',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/_groq/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (GROQ_KEY) proxyReq.setHeader('Authorization', `Bearer ${GROQ_KEY}`);
            });
          },
        },
        '/_mymemory': {
          target: 'https://api.mymemory.translated.net',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/_mymemory/, ''),
        },
      },
    },
  }
});
