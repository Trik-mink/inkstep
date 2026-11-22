import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const preview = new URL('../artifacts/handwriting-preview.html', import.meta.url).href

async function draw(page: Page, offset = 0) {
  const board = (await page.getByTestId('whiteboard').boundingBox())!
  const x = board.x + board.width * 0.2
  const y = board.y + board.height * 0.4 + offset
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + board.width * 0.25, y + 20, { steps: 12 })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto(preview)
  await expect(page.getByRole('main')).toHaveAttribute('data-ready', 'true')
})

test('write, erase, undo, redo, and restore the actual drawing after refresh', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Check my work' })).toBeDisabled()
  await draw(page)
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByTestId('stroke-count')).toHaveText('0 strokes captured')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
  await page.getByRole('button', { name: 'Eraser', exact: true }).click()
  const box = (await page.getByTestId('whiteboard').boundingBox())!
  await page.mouse.click(box.x + box.width * 0.325, box.y + box.height * 0.4 + 10)
  await expect(page.getByTestId('stroke-count')).toHaveText('0 strokes captured')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await page.reload()
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
})

test('manual capture needs an explicit transcription and exports an honest sample', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByRole('button', { name: 'Confirm & save sample' })).toBeDisabled()
  await expect(page.getByText('Manual transcription - no recognition service')).toBeVisible()
  await page.getByLabel('Enter exactly what you wrote').fill('x = 26')
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await expect(page.getByRole('heading', { name: '1 sample saved' })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await expect(page.getByRole('heading', { name: '1 sample saved' })).toBeVisible()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export collection' }).click()
  const download = await downloading
  const collection = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(collection.samples).toHaveLength(1)
  expect(collection.samples[0]).toMatchObject({ source: 'manual', confirmedExpression: 'x = 26', eligibleForAccuracy: false, corrected: false })
  expect(collection.samples[0].submission.strokes).toHaveLength(1)
  expect(collection.samples[0].submission.image).toMatch(/^data:image\/png;base64,/)
})

test('a simulated misread can be corrected without being counted as real recognition', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('simulation')
  await page.getByLabel('Sample response', { exact: true }).selectOption('misread')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByLabel('Does this match your writing?')).toHaveValue('x + 1 = 19')
  await expect(page.getByText('Scripted response - does not read your ink')).toBeVisible()
  await page.getByLabel('Does this match your writing?').fill('x + 7 = 19')
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export collection' }).click()
  const collection = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'))
  expect(collection.samples[0]).toMatchObject({ candidate: 'x + 1 = 19', confirmedExpression: 'x + 7 = 19', source: 'simulation', corrected: true, eligibleForAccuracy: false })
})

test('a late response cannot be confirmed against newer handwriting', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('simulation')
  await page.getByLabel('Sample response', { exact: true }).selectOption('slow')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByRole('button', { name: 'Check my work' })).toBeDisabled()
  await draw(page, 45)
  await expect(page.getByText('Your board changed. Check your work again to review the new version.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm & save sample' })).toBeDisabled()
  await expect(page.getByTestId('stroke-count')).toHaveText('2 strokes captured')
})

test('a provider-style error preserves the ink and permits recovery in place', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('simulation')
  await page.getByLabel('Sample response', { exact: true }).selectOption('failure')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByRole('alert')).toContainText('Your writing is still here')
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('manual')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByLabel('Enter exactly what you wrote')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('cancelling a pending check permits a new manual submission', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('simulation')
  await page.getByLabel('Sample response', { exact: true }).selectOption('slow')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await page.getByRole('button', { name: 'Cancel request' }).click()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('manual')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByLabel('Enter exactly what you wrote')).toHaveValue('')
})

test('corrupted device storage is reported and is not silently overwritten', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('inkstep:lab:draft:v1', '{broken'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Existing storage was left unchanged')
  await draw(page)
  expect(await page.evaluate(() => localStorage.getItem('inkstep:lab:draft:v1'))).toBe('{broken')
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Export collection' })).toBeEnabled()
})

test('cancelled pointer input does not leave a partial stroke or lock the board', async ({ page }) => {
  const canvas = page.getByTestId('whiteboard')
  await canvas.evaluate(element => element.addEventListener('pointerdown', event => {
    (element as HTMLCanvasElement).dataset.activePointer = String((event as PointerEvent).pointerId)
  }))
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + 60, box.y + 60)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y + 80)
  const pointerId = Number(await canvas.getAttribute('data-active-pointer'))
  await canvas.dispatchEvent('pointercancel', { pointerId, pointerType: 'mouse' })
  await page.mouse.up()
  await expect(page.getByTestId('stroke-count')).toHaveText('0 strokes captured')
  await draw(page)
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
})

test('tablet touch input is ignored until the learner explicitly enables it', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true })
  try {
    const page = await context.newPage()
    await page.goto(preview)
    await expect(page.getByRole('button', { name: 'Check my work' })).toBeInViewport()
    const box = (await page.getByTestId('whiteboard').boundingBox())!
    await page.touchscreen.tap(box.x + 40, box.y + 40)
    await expect(page.getByTestId('stroke-count')).toHaveText('0 strokes captured')
    await page.getByRole('button', { name: 'Board menu', exact: true }).click()
    await page.getByLabel('Ignore finger touches').uncheck()
    await page.getByRole('button', { name: 'Close board menu', exact: true }).click()
    await page.getByTestId('whiteboard').scrollIntoViewIfNeeded()
    const enabledBox = (await page.getByTestId('whiteboard').boundingBox())!
    await page.touchscreen.tap(enabledBox.x + 40, enabledBox.y + 40)
    await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
  } finally { await context.close() }
})

for (const width of [320, 768, 1024, 1440]) {
  test(`usable layout at ${width}px with no external requests or browser errors`, async ({ page }, testInfo) => {
    const errors: string[] = []
    const external: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()) })
    await page.setViewportSize({ width, height: width === 320 ? 720 : width === 768 ? 1024 : width === 1024 ? 768 : 900 })
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('whiteboard')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.getByRole('dialog', { name: 'Read your writing' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
    for (const world of ['Enchanted woodland classroom', 'Magical storybook desk']) {
      await page.getByRole('button', { name: 'Board menu', exact: true }).click()
      await page.getByRole('button', { name: world, exact: true }).click()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: 'Check my work' })).toBeInViewport()
      await page.screenshot({ path: fileURLToPath(new URL(`../artifacts/${testInfo.project.name}-${width}-${world.startsWith('Enchanted') ? 'woodland' : 'desk'}.png`, import.meta.url)), fullPage: true })
    }
    expect(errors).toEqual([])
    expect(external).toEqual([])
  })
}

test('switching worlds preserves handwriting, undo history, and an edited transcription', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Check my work' }).click()
  await page.getByLabel('Enter exactly what you wrote').fill('x = 12')
  const before = await page.getByTestId('whiteboard').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByRole('button', { name: 'Magical storybook desk', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Magical storybook desk', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Enter exactly what you wrote')).toHaveValue('x = 12')
  expect(await page.getByTestId('whiteboard').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).toBe(before)
  await page.getByRole('button', { name: 'Back to writing', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Read your writing' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Check my work' }).click()
  await expect(page.getByLabel('Enter exactly what you wrote')).toHaveValue('x = 12')
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await expect(page.getByRole('dialog', { name: 'Read your writing' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByTestId('stroke-count')).toHaveText('0 strokes captured')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
  await page.reload()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Magical storybook desk', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: '1 sample saved' })).toBeVisible()
})

test('a pending simulated check survives a world switch', async ({ page }) => {
  await draw(page)
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('simulation')
  await page.getByLabel('Sample response', { exact: true }).selectOption('slow')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Check my work' }).click()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByRole('button', { name: 'Magical storybook desk', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Does this match your writing?')).toHaveValue('x + 7 = 19')
  await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
})

test('portrait writing uses the available paper and its snapshot matches the visible proportions', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  const board = (await page.getByTestId('whiteboard').boundingBox())!
  expect(board.height).toBeGreaterThan(540)
  await draw(page)
  await page.getByRole('button', { name: 'Check my work' }).click()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByText('View submitted handwriting').click()
  const image = page.getByAltText('The exact handwriting snapshot submitted for this review')
  await expect(image).toBeVisible()
  const ratio = await image.evaluate(img => (img as HTMLImageElement).naturalWidth / (img as HTMLImageElement).naturalHeight)
  expect(ratio).toBeCloseTo(board.width / board.height, 2)
})
