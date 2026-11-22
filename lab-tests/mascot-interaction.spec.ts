import { expect, test } from '@playwright/test'
const preview = new URL('../artifacts/handwriting-preview.html', import.meta.url).href

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
test(`mascot stays put and tools keep their appearance at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true })
  try {
    const page = await context.newPage()
    await page.goto(preview)
    await expect(page.getByRole('main')).toHaveAttribute('data-ready', 'true')
    await page.getByRole('button', { name: 'Board menu', exact: true }).click()
    await page.getByLabel('Ignore finger touches').uncheck()
    await page.keyboard.press('Escape')
    const reserve = page.getByTestId('companion-reserve')
    const original = (await reserve.boundingBox())!
    const mascot = (await reserve.locator('img').boundingBox())!
    const canvas = (await page.getByTestId('whiteboard').boundingBox())!
    const appearance = () => page.locator('.notebook-toolbar button').evaluateAll(buttons => buttons.map(button => {
      const style = getComputedStyle(button)
      return { opacity: style.opacity, background: style.backgroundColor, shadow: style.boxShadow, pressed: button.getAttribute('aria-pressed') }
    }))
    const before = await appearance()
    await page.mouse.move(canvas.x + 300, canvas.y + 300)
    await page.mouse.down()
    expect(await appearance()).toEqual(before)
    await page.mouse.move(mascot.x + mascot.width / 2, mascot.y + mascot.height / 2, { steps: 15 })
    expect(await reserve.boundingBox()).toEqual(original)
    await page.mouse.up()
    await expect(page.getByTestId('stroke-count')).toHaveText('1 stroke captured')
    const afterWriting = await page.evaluate(() => localStorage.getItem('inkstep:lab:draft:v1'))
    await page.touchscreen.tap(mascot.x + mascot.width / 2, mascot.y + mascot.height / 2)
    expect(await reserve.boundingBox()).toEqual(original)
    expect(await page.evaluate(() => localStorage.getItem('inkstep:lab:draft:v1'))).toBe(afterWriting)
    expect(await reserve.locator('img').boundingBox()).toEqual(mascot)
    const points = await page.evaluate(() => JSON.parse(localStorage.getItem('inkstep:lab:draft:v1')!).strokes[0].points as { x: number; y: number }[])
    expect(points.every(point => {
      const x = canvas.x + point.x / 1000 * canvas.width, y = canvas.y + point.y / 560 * canvas.height
      return x < original.x || y < original.y || x > original.x + original.width || y > original.y + original.height
    })).toBe(true)
    // The companion area must absorb touches, rather than allowing them to hit the board underneath.
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.companion-corner'), { x: mascot.x + mascot.width / 2, y: mascot.y + mascot.height / 2 })).toBe(true)
    // Large, crossing strokes must not shrink the mascot into the toolbar.
    for (const [start, end] of [
      [[canvas.x + 5, canvas.y + 5], [canvas.x + canvas.width - 5, canvas.y + canvas.height - 5]],
      [[canvas.x + canvas.width - 5, canvas.y + 5], [canvas.x + 5, canvas.y + canvas.height - 5]],
      [[canvas.x + 5, canvas.y + 320], [canvas.x + canvas.width - 5, canvas.y + 320]],
    ]) {
      await page.mouse.move(start[0], start[1]); await page.mouse.down(); await page.mouse.move(end[0], end[1], { steps: 15 }); await page.mouse.up()
    }
    expect(await reserve.boundingBox()).toEqual(original)
    await expect(reserve.locator('img')).toBeVisible()
    expect((await reserve.locator('img').boundingBox())!.height).toBe(100)
  } finally { await context.close() }
})
}
