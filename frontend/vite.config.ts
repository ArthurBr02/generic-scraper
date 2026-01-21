import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true, // Permet l'accès depuis l'extérieur du conteneur
    strictPort: true, // Échoue si le port est déjà utilisé
    watch: {
      usePolling: true, // Nécessaire pour le hot-reload dans Docker
    },
  },
})
