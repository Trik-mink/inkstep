import { defineConfig } from 'vitest/config'

// Permission checks need the real SDK evaluator, but no registered app or credentials.
export default defineConfig({
  test: { include: ['src/schemas/practice-sessions-schema.test.ts'], environment: 'node' },
})
