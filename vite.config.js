import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      'path': 'path-browserify'
    }
  },
  server: {
    port: 3010,
    strictPort: false,
    fs: {
      allow: ['..']
    }
  }
});