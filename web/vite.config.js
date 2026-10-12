import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://localhost:3000',
      '^/[A-Za-z0-9_-]{3,32}$': process.env.VITE_API_PROXY || 'http://localhost:3000',
    },
  },
});
