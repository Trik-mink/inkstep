import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '../artifacts/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { viewport: { width: 1440, height: 1050 }, trace: 'retain-on-failure' },
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
})
