import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  vitePlugin: {
    inspector: false
  }
};
