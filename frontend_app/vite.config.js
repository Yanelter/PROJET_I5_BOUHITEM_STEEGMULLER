import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Indispensable pour Docker
    strictPort: true,
    port: 3000, 
    watch: {
      usePolling: true, // Aide sur Windows pour voir les changements de fichiers
    }
  }
})