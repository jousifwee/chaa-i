import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/app/svelte/' : '/',
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}));
