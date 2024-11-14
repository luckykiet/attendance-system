/* eslint-disable no-undef */
import * as path from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    basicSsl(),
    eslint(),
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  build: {
    outDir: 'build',
  },
  server: {
    host: 'vcap.me',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://vcap.me:4000',
        secure: false,
      },
      '/auth': {
        target: 'https://vcap.me:4000',
        secure: false,
      },
      '/mod': {
        target: 'https://vcap.me:4000',
        secure: false,
      },
    },
  },
  preview: {
    open: true,
    port: 5173,
  },
});
