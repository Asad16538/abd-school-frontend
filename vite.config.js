import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // Relative path for subdomain folders
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'xlsx': ['xlsx', 'file-saver'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['xlsx', 'file-saver'],
  },
  server: {
    port: 5173,
  },
})