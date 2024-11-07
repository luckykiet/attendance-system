import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve('src')
    }
  },
  server: {
    host: 'admin.vcap.me',
    port: 5173,
    proxy: {
      '/': {
        target: 'https://api.vcap.me:4000',
        secure: false,
        bypass(req) {
          if (req.url && (req.url === '/' || req.url.startsWith('/admin'))) {
            return req.url;
          }
        }
      },
      '/api': {
        target: 'https://admin.vcap.me:4000',
        secure: false,
      },
      '/mod': {
        target: 'https://admin.vcap.me:4000',
        secure: false,
      },
    }
  },
  preview: {
    open: true,
    port: 5173,
  },
  base: '/admin'
});
