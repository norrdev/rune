import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@stores': path.resolve(dirname, './src/stores'),
      '@components': path.resolve(dirname, './src/components'),
      '@services': path.resolve(dirname, './src/services'),
      '@utils': path.resolve(dirname, './src/utils'),
      '@pages': path.resolve(dirname, './src/routes'),
      '@hooks': path.resolve(dirname, './src/hooks'),
      '@types': path.resolve(dirname, './src/types'),
      '@styles': path.resolve(dirname, './src/styles'),
      '@config': path.resolve(dirname, './src/config'),
      '@contexts': path.resolve(dirname, './src/contexts'),
      '@assets': path.resolve(dirname, './src/assets'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
