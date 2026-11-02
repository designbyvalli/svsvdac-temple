import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/prokerala-token': {
                target: 'https://api.prokerala.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/prokerala-token/, '/token')
            },
            '/prokerala-api': {
                target: 'https://api.prokerala.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/prokerala-api/, '')
            }
        }
    }
});