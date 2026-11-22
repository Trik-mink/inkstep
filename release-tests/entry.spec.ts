import { test, expect } from 'deepspace/testing'

for (const viewport of [{ width: 320, height: 800 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
  test(`welcome feels like a single-screen app entrance at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ready for a little discovery?' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open my notebook' })).toBeInViewport()
    await page.locator('.notebook-scene img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/welcome-${viewport.width}.png`, fullPage: true })
    expect(errors).toEqual([])
  })
}

test('parent details are secondary and the welcome opens the existing sign-in flow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'For parents', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'A notebook for your family.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Parent sign-in/ })).toBeVisible()
  await page.getByRole('button', { name: 'Close parent information' }).click()
  await expect(page.getByRole('link', { name: /^Parent sign-in/ })).not.toBeVisible()
  await page.getByRole('link', { name: 'Open my notebook' }).click()
  await expect(page.getByRole('heading', { name: 'A notebook for your family.' })).toBeVisible()
  await page.getByRole('button', { name: 'Parent sign-in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
})

test('returning learners choose notebooks and parent setup stays secondary', async ({ users }) => {
  const [{ page }] = await users(1)
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/learn')
  await expect(page.locator('.learner-entry')).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('heading', { name: 'Who’s exploring today?' })).toBeVisible()
  if (await page.locator('.learner-book').count() === 0) {
    await page.getByLabel('Nickname').fill('Little Explorer')
    await page.getByRole('button', { name: 'Create notebook' }).click()
    await expect(page.getByTestId('whiteboard')).toBeVisible()
    await page.getByRole('button', { name: 'Back to learners' }).click()
  }
  await expect(page.locator('.learner-book').first()).toBeVisible()
  await expect(page.getByLabel('Nickname')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent discoveries' })).not.toBeVisible()
  await page.screenshot({ path: 'artifacts/learner-notebooks.png', fullPage: true })
  await page.getByRole('button', { name: 'Add a new notebook' }).click()
  await expect(page.getByLabel('Nickname')).toBeFocused()
  await page.getByRole('button', { name: 'Close new notebook form' }).click()
  await expect(page.getByRole('button', { name: 'Add a new notebook' })).toBeFocused()
  await page.locator('.learner-book').first().click()
  await expect(page.getByTestId('whiteboard')).toBeVisible()
})
