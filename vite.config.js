import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'data',
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: true,
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    exclude: ['d3', 'topojson-client', 'globe.gl'],
  },
  server: {
    port: 3000,
    proxy: {
      '/proxy': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
});
