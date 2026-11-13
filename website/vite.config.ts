import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    // Generated site lives apart from the hand-written docs/ folder and is cleared on every build.
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'react-native-journey-recovery': path.resolve(__dirname, '../src/index.ts'),
      // The playground is a React Native app rendered on the web.
      'react-native': 'react-native-web',
    },
  },
});

