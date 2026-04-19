import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8060,
    proxy: {
  '/api': {
    target: 'http://127.0.0.1:8060', // Must match backend .env
    changeOrigin: true,
  }
}
  }
});
