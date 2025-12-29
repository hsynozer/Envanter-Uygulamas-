
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Tüm ağ kartlarını dinle (10.0.33.207 dahil)
    port: 5173,
    strictPort: true
  }
});
