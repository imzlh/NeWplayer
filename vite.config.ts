import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/@neast/': {
        target: 'http://192.168.1.2:3000',  // 确保这是正确的 API 地址
        changeOrigin: true,
        rewrite: (path) => path.replace('/@neast/', ''),
      },
      '/cgi-bin/': {
        target: 'http://192.168.1.1/',  // 确保这是正确的 API 地址
        changeOrigin: true,
        rewrite(path){
          const url = new URL(path, 'http://192.168.1.1/');
          url.pathname += '.php';
          return url.pathname + url.search;
        }
      }
    },
  },
  build: {
    target: 'chrome70',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          return 'index';
        }
      }
    }
  },
  base: './',
  envPrefix: ['NEWP_', 'VITE_']
})
