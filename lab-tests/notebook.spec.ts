import { expect, test, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'
const preview = new URL('../artifacts/handwriting-preview.html', import.meta.url).href

async function write(page: Page) {
  const box = (await page.getByTestId('whiteboard').boundingBox())!
  await page.mouse.move(box.x + 110, box.y + 160)
  await page.mouse.down()
  await page.mouse.move(box.x + 280, box.y + 210, { steps: 15 })
  await page.mouse.up()
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  test(`exercise-book states and real canvas coverage at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport)
    await page.goto(preview)
    await expect(page.getByRole('button', { name: 'Pen', exact: true })).toBeEnabled()
    const canvas = (await page.getByTestId('whiteboard').boundingBox())!
    // Subtract the reserved corner, not the surrounding decorative page.
    expect((canvas.width * canvas.height - 216 * 104) / (viewport.width * viewport.height)).toBeGreaterThanOrEqual(.70)
    const toolbar = (await page.getByRole('group', { name: 'Whiteboard tools' }).boundingBox())!
    expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(canvas.y)
    const snapshot = (state: string) => page.screenshot({ path: fileURLToPath(new URL(`../artifacts/${info.project.name}-notebook-${viewport.width}-${state}.png`, import.meta.url)) })
    await snapshot('empty')
    await write(page)
    await snapshot('written')
    await page.getByRole('button', { name: 'Check my work' }).click()
    await page.getByLabel('Enter exactly what you wrote').fill('x = 12')
    const feedback = (await page.getByRole('dialog', { name: 'Read your writing' }).boundingBox())!
    expect((canvas.width * canvas.height - 216 * 104 - feedback.width * feedback.height) / (viewport.width * viewport.height)).toBeGreaterThanOrEqual(.70)
    await snapshot('review')
    for (const control of await page.locator('button:visible, input:visible, select:visible').all()) {
      const bounds = (await control.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
    }
    await page.getByRole('button', { name: 'Back to writing', exact: true }).click()
    await page.getByRole('button', { name: 'Board menu', exact: true }).click()
    await page.getByLabel('Capture method').selectOption('simulation')
    await page.getByLabel('Sample response', { exact: true }).selectOption('failure')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Check my work' }).click()
    await expect(page.getByRole('alert')).toContainText('Your writing is still here')
    await snapshot('error')
    await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
  })
}

test('companion selection is independent of stationery and preserves review, ink, and revision', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto(preview)
  await expect(page.getByRole('main')).toHaveAttribute('data-ready', 'true')
  await write(page)
  await page.getByRole('button', { name: 'Check my work' }).click()
  await page.getByLabel('Enter exactly what you wrote').fill('x = 12')
  const original = await page.evaluate(() => localStorage.getItem('inkstep:lab:draft:v1'))
  const pixels = await page.getByTestId('whiteboard').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByRole('button', { name: 'Choose owl', exact: true }).click()
  await page.getByRole('button', { name: 'Magical storybook desk', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Enter exactly what you wrote')).toHaveValue('x = 12')
  expect(await page.evaluate(() => localStorage.getItem('inkstep:lab:draft:v1'))).toBe(original)
  expect(await page.getByTestId('whiteboard').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).toBe(pixels)
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await page.reload()
  await expect(page.getByAltText('Your tawny owl companion')).toBeVisible()
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await expect(page.getByRole('heading', { name: '1 sample saved' })).toBeVisible()
  await page.getByRole('button', { name: 'Enchanted woodland classroom', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Choose owl', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

for (const crowded of [false, true]) {
  test(`restored ${crowded ? 'crowded page uses snapshot review' : 'corner ink moves the companion'} without rewriting the draft`, async ({ page }) => {
    const points = crowded ? [{ x: 0, y: 0, pressure: .5, time: 1 }, { x: 1000, y: 560, pressure: .7, time: 2 }] : [{ x: 950, y: 530, pressure: .7, time: 1 }]
    const draft = { version: 1, revision: 7, strokes: [{ id: 'legacy-stroke', points }] }
    await page.addInitScript(value => localStorage.setItem('inkstep:lab:draft:v1', JSON.stringify(value)), draft)
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto(preview)
    await expect(page.getByRole('main')).toHaveAttribute('data-ready', 'true')
    await expect(page.getByRole('main')).toHaveAttribute('data-corner', crowded ? 'margin' : 'bottom-left')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('inkstep:lab:draft:v1')!))).toEqual(draft)
    if (crowded) {
      expect(await page.getByTestId('whiteboard').evaluate(canvas => getComputedStyle(canvas).clipPath)).toBe('none')
      await expect(page.getByTestId('companion-reserve').locator('img')).toBeVisible()
      expect((await page.getByTestId('companion-reserve').locator('img').boundingBox())!.height).toBe(100)
      await page.getByRole('button', { name: 'Check my work' }).click()
      await expect(page.getByRole('dialog', { name: 'Read your writing' })).toHaveAttribute('aria-modal', 'true')
      await expect(page.getByAltText('Submitted handwriting preserved for review')).toBeVisible()
      await page.getByLabel('Enter exactly what you wrote').fill('x = 12')
      await page.getByRole('button', { name: 'Confirm & save sample' }).click()
      await expect(page.getByRole('dialog', { name: 'Read your writing' })).toHaveCount(0)
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('inkstep:lab:draft:v1')!))).toEqual(draft)
    }
  })
}

test('storage failure warns the student without covering the problem or writing', async ({ page }) => {
  await page.goto(preview)
  await page.evaluate(() => localStorage.setItem('inkstep:lab:draft:v1', '{broken'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Existing storage was left unchanged')
  const alert = (await page.getByRole('alert').boundingBox())!
  const canvas = (await page.getByTestId('whiteboard').boundingBox())!
  expect(alert.y + alert.height).toBeLessThanOrEqual(canvas.y)
  await expect(page.getByText('Session only · export work', { exact: true })).toBeVisible()
})
