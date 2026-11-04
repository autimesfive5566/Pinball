import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  preview: { port: 1421, strictPort: true },
  build: { target: 'es2022' },
});
