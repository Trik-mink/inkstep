import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', workers: 1, retries: 0, timeout: 60000,
  outputDir: '../artifacts/release-tests', reporter: 'list',
  use: { baseURL: process.env.INKSTEP_BASE_URL ?? 'http://127.0.0.1:5173', channel: 'chrome', headless: true, viewport: { width: 1200, height: 900 }, trace: 'retain-on-failure' },
})
