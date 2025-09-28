import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4000,
    proxy: {
      '/api': {
        target: 'http://39.96.187.7:9000', // 测试环境后端地址
        changeOrigin: true,
      },
    },
  },
})