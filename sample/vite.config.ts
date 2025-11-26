import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@lib': new URL('./lib', import.meta.url).pathname,
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
  },
}); 