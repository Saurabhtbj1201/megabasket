import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://megabasket-lfm1.onrender.com', // Remove /api from target
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'), // Keep /api prefix
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': process.env // Expose env variables
  }
})
