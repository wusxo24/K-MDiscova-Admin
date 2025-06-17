import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'https://kmdiscova.id.vn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(`Proxying ${path} to https://kmdiscova.id.vn${path}`);
          return path; // Keep /api prefix
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});