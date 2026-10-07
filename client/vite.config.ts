import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    // Pre-bundle everything up front; otherwise Vite discovers deps lazily per route and reloads the page mid-session.
    optimizeDeps: {
      include: ['react', 'react-dom/client', 'react-router-dom', 'axios', 'joi', 'react-hook-form', '@hookform/resolvers/joi', '@tanstack/react-table'],
    },
    server: {
      port: 5173,
      // Vite rejects unknown Host headers. Allow Cloudflare quick tunnels (*.trycloudflare.com);
      // add other tunnel hosts (comma separated) via VITE_ALLOWED_HOSTS, e.g. ".ngrok-free.app,.loca.lt".
      allowedHosts: ['.trycloudflare.com', ...(env.VITE_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? [])],
      // Dev proxy so the browser talks to one origin; production sets VITE_API_BASE_URL.
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
        '/admin/queues': { target: env.VITE_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true }, // Bull Board
      },
    },
    preview: { allowedHosts: ['.trycloudflare.com', ...(env.VITE_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? [])] },
  };
});
