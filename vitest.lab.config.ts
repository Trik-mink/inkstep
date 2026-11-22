import { defineConfig } from 'vitest/config'

// The isolated handwriting experiment does not import platform state or an app id.
export default defineConfig({
  test: { include: ['src/features/handwriting/**/*.test.ts'], environment: 'node' },
})
