import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../docs'),
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      'react-native-journey-recovery': path.resolve(__dirname, '../src/index.ts'),
    },
  },
});

