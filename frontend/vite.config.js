import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        index: './index.html',
        master: './master.html',
        student: './student.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: ['..'],
    },
  },
});