import { test, expect } from 'deepspace/testing'

for (const width of [390, 1024]) {
  test(`notebook settings and navigation work at ${width}px`, async ({ users }) => {
    const [{ page }] = await users(1)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Notebook settings' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your family account' })).toBeVisible()
    const email = page.locator('.notebook-settings-paper dd').last()
    await expect(email).toContainText('@')
    const accountEmail = await email.textContent()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/settings-${width}.png`, fullPage: true })
    if (width < 768) {
      await page.getByRole('button', { name: 'Toggle menu' }).click()
      await expect(page.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute('aria-expanded', 'true')
    }
    await page.getByRole('link', { name: 'Notebooks', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Who’s exploring today?' })).toBeVisible()
    if (width < 768) await expect(page.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute('aria-expanded', 'false')
    await page.getByRole('button', { name: 'Account menu' }).click()
    await expect(page.getByTestId('nav-user-email')).toHaveText(accountEmail!)
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible()
    expect(errors).toEqual([])
  })
}
