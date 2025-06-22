import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 🚀 BUNDLE ANALYZER: Visualizar composição dos bundles
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // treemap, sunburst, network
    })
  ],

  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,

    // 🚀 ASSET OPTIMIZATION: Configurações para otimizar assets
    rollupOptions: {
      output: {
        // 🚀 ASSET NAMING: Nomes consistentes com hash para cache
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // 🚀 CHUNK SIZE: Configurar limites para otimização
    chunkSizeWarningLimit: 1000,

    // 🚀 ASSETS: Configurar inline de assets pequenos
    assetsInlineLimit: 4096, // 4KB - assets menores serão inline

    // 🚀 TREE SHAKING: Configurações avançadas já estão em rollupOptions acima
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
