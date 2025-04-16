import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: 'process',
      buffer: 'buffer',
      global: 'globalthis',
      randombytes: 'randombytes',
      util: 'util',
      'readable-stream': 'readable-stream',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'simple-peer',
      'globalthis',
      'randombytes',
      'util',
      'readable-stream',
    ],
    force: true,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/simple-peer/, /readable-stream/, /randombytes/, /util/, /buffer/, /process/],
    },
    assetsDir: 'assets',
  },
  server: {
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Removed rewrite to match backend /api prefix
        onProxyReq: (proxyReq, req) => {
          console.log('Proxying request:', req.url, 'to', `http://127.0.0.1:5000${req.url}`);
        },
        onProxyError: (err, req, res) => {
          console.error('Proxy error:', err.message, 'for request:', req.url);
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
      },
    },
    host: '0.0.0.0',
    port: 5173,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
});