import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/features/tutor/**/*.test.ts', 'src/actions/tutor.test.ts'], environment: 'node' } })
