import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.esm.js' : 'index.js'),
    },
    rollupOptions: {
      external: ['jotai', 'react', 'react-dom'],
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
