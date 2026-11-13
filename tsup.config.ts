import { defineConfig } from 'tsup';

// Ships CommonJS (dist/index.js) and ESM (dist/index.mjs) with matching type declarations,
// so the package loads in Metro, Node, Jest and bundlers alike.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  outDir: 'dist',
});
