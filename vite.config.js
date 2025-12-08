import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: '/admin.html'  // 開発サーバー起動時に admin.html を開く
    },
    build: {
        rollupOptions: {
            input: {
                admin: resolve(__dirname, 'admin.html')
            }
        }
    }
})
