import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 让打包后的 dist 可以直接双击 index.html 打开（hash 路由）
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
})
