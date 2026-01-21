import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true, // Permet l'accès depuis l'extérieur du conteneur
    strictPort: true, // Échoue si le port est déjà utilisé
    watch: {
      usePolling: true, // Nécessaire pour le hot-reload dans Docker
    },
    proxy: {
      '/api': {
        target: 'http://backend:4000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
