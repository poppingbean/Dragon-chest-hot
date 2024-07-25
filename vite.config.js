import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    sveltekit(),
    nodePolyfills({
      // Include only necessary polyfills
      include: ['buffer', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  resolve: {
    alias: {
      $lib: '/src/lib',
      $stores: '/src/store',
      $routes: '/src/routes',
      $api: '/src/routes/api',
      $pages: '/src/routes/pages',
      $static: '/src/static',
      $env: '/src/env',
    }
  },
  build: {
    rollupOptions: {
      outDir: 'out',
      // plugins: [
      //   nodePolyfills()
      // ]
    }
  }
});
