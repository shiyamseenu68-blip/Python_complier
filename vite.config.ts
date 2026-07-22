import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Python backend is started by `scripts/start-python.mjs` (predev hook).
// This config ONLY sets up the proxy — no plugin, no spawn, no require().
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/run':    { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws':     { target: 'ws://localhost:8000',  ws: true, changeOrigin: true },
    },
  },
});
