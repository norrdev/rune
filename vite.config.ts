import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [],
      },
    }),
    process.env.VITE_ENABLE_CLOUDFLARE === 'true' ? cloudflare() : undefined,
  ].filter(Boolean),
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        format: 'esm',
        manualChunks: {
          'react-mobx-idb-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-markdown',
            'mobx',
            'mobx-react-lite',
            'idb',
          ],
          'maplibre-gl-vendor': ['maplibre-gl'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
  publicDir: 'public',
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@assets': resolve(__dirname, './src/assets'),
      '@utils': resolve(__dirname, './src/utils'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
      '@config': resolve(__dirname, './src/config'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@services': resolve(__dirname, './src/services'),
      '@stores': resolve(__dirname, './src/stores'),
    },
  },
  assetsInclude: ['README.md', 'LICENSE.md'],
});
