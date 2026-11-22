import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('drawing and confirming work on an insecure HTTP origin like the iPad LAN preview', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true })
  try {
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    // Serve the real export at a non-localhost HTTP origin, without changing browser security settings.
    const html = await readFile(new URL('../artifacts/handwriting-preview.html', import.meta.url), 'utf8')
    await page.route('http://inkstep.test/**', route => route.fulfill({ contentType: 'text/html', body: html }))
    await page.goto('http://inkstep.test/handwriting-preview.html')
    expect(await page.evaluate(() => window.isSecureContext)).toBe(false)
    expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined')
    await expect(page.getByRole('main')).toHaveAttribute('data-ready', 'true')
    await page.getByRole('button', { name: 'Board menu', exact: true }).click()
    await page.getByLabel('Ignore finger touches').uncheck()
    await page.keyboard.press('Escape')
    const board = (await page.getByTestId('whiteboard').boundingBox())!
    await page.touchscreen.tap(board.x + board.width / 2, board.y + board.height / 2)
    await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
    await page.getByRole('button', { name: 'Check my work' }).click()
    await page.getByLabel('Enter exactly what you wrote').fill('x = 12')
    await page.getByRole('button', { name: 'Confirm & save sample' }).click()
    await page.getByRole('button', { name: 'Board menu', exact: true }).click()
    await expect(page.getByRole('heading', { name: '1 sample saved' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.reload()
    await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
