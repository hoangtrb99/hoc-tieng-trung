import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' de dist/ chay duoc khi dat trong thu muc con hoac mo bang static server bat ky.
// format 'iife' + inlineDynamicImports: 1 bundle duy nhat, de `npm run single` ghep thanh 1 file HTML.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 1024 * 1024,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
});
