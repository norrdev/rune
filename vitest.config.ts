import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@stores': path.resolve(import.meta.dirname, './src/stores'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@services': path.resolve(import.meta.dirname, './src/services'),
      '@utils': path.resolve(import.meta.dirname, './src/utils'),
      '@pages': path.resolve(import.meta.dirname, './src/routes'),
      '@hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@types': path.resolve(import.meta.dirname, './src/types'),
      '@styles': path.resolve(import.meta.dirname, './src/styles'),
      '@config': path.resolve(import.meta.dirname, './src/config'),
      '@contexts': path.resolve(import.meta.dirname, './src/contexts'),
      '@assets': path.resolve(import.meta.dirname, './src/assets'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
