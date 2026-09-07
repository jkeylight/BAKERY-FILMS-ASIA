import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // SPA fallback for client-side routes
    historyApiFallback: true,
    // Proxy API calls to the production server or a mock
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Resolve .ts extensions
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
})
