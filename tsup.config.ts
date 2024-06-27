import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  tsconfig: './tsconfig.json',
  clean: true,
  dts: true,
})
