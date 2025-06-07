import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: './', // ✅ ضروري للإنتاج على Render
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
      '@assets': resolve(__dirname, 'attached_assets'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'https://cleander-project-server.onrender.com',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
