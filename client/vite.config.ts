import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom/client', 'react-router-dom', 'axios', 'joi', 'react-hook-form', '@hookform/resolvers/joi', '@tanstack/react-table'],
    },
    server: {
      port: 5173,
      allowedHosts: ['.trycloudflare.com', ...(env.VITE_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? [])],
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
        '/admin/queues': { target: env.VITE_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
      },
    },
    preview: { allowedHosts: ['.trycloudflare.com', ...(env.VITE_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? [])] },
  };
});
