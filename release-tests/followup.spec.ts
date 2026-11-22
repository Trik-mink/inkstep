import { test, expect } from 'deepspace/testing'
import type { Page } from '@playwright/test'

async function notebook(page: Page, label: string) {
  await page.goto('/learn')
  await expect(page.locator('.learner-entry')).toHaveAttribute('aria-busy', 'false')
  if (await page.getByRole('button', { name: 'Add a new notebook' }).isVisible()) await page.getByRole('button', { name: 'Add a new notebook' }).click()
  await page.getByLabel('Nickname').fill(label)
  await page.getByRole('button', { name: 'Create notebook' }).click()
  await expect(page.getByTestId('whiteboard')).toBeVisible()
}
async function menu(page: Page) { await page.getByRole('button', { name: 'Board menu', exact: true }).click() }
async function closeMenu(page: Page) { await page.getByRole('button', { name: 'Close board menu', exact: true }).click() }
async function manual(page: Page) { await menu(page); await page.getByLabel('Capture method').selectOption('manual'); await closeMenu(page) }
async function submit(page: Page, text: string) {
  await page.getByRole('button', { name: 'Check my work', exact: true }).click()
  await page.getByLabel('Enter exactly what you wrote').fill(text)
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
}

test('each learner keeps a companion and stationery across notebooks, problems, and reload', async ({ users }) => {
  const [{ page }] = await users(1)
  const suffix = Date.now().toString().slice(-6)
  const fox = `Fox home ${suffix}`, owl = `Owl home ${suffix}`
  await notebook(page, fox)
  await menu(page); await page.getByRole('button', { name: 'Choose fox', exact: true }).click()
  await page.getByRole('button', { name: 'Enchanted woodland classroom' }).click(); await closeMenu(page)
  await page.getByRole('button', { name: 'Back to learners' }).click()
  await notebook(page, owl)
  await menu(page); await page.getByRole('button', { name: 'Choose owl', exact: true }).click()
  await page.getByRole('button', { name: 'Magical storybook desk' }).click(); await closeMenu(page)
  const owlImage = await page.locator('.companion-corner img').getAttribute('src')
  await page.getByRole('button', { name: 'Back to learners' }).click()
  const owlBook = page.getByRole('button', { name: new RegExp(owl) })
  await expect(owlBook.locator('img')).toHaveAttribute('src', owlImage!)
  await page.getByRole('button', { name: new RegExp(fox) }).click()
  await menu(page)
  await expect(page.getByRole('button', { name: 'Choose fox', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Enchanted woodland classroom' })).toHaveAttribute('aria-pressed', 'true')
  await closeMenu(page)
  await manual(page); await submit(page, 'x=12')
  await page.getByRole('button', { name: 'Next adventure' }).click()
  await menu(page)
  await expect(page.getByRole('button', { name: 'Choose fox', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await closeMenu(page); await page.reload()
  await page.getByRole('button', { name: new RegExp(owl) }).click()
  await menu(page)
  await expect(page.getByRole('button', { name: 'Choose owl', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Magical storybook desk' })).toHaveAttribute('aria-pressed', 'true')
})

test('old solved progress survives more than 100 later attempts and resumes the next problem', async ({ users }) => {
  test.setTimeout(180000)
  const [{ page }] = await users(1)
  const label = `History ${Date.now().toString().slice(-7)}`
  await notebook(page, label); await manual(page); await submit(page, 'x=12')
  await page.getByRole('button', { name: 'Next adventure' }).click(); await manual(page)
  await page.route('**/api/actions/tutor-grade', async route => {
    const original = route.request().postDataJSON()
    const response = await route.fetch()
    expect(response.ok()).toBe(true)
    for (let index = 0; index < 105; index++) {
      // Reuse the real authenticated application request without extracting its token.
      const later = await route.fetch({ postData: JSON.stringify({ ...original, submissionId: `history-${index}`, response: `x=${100 + index}` }) })
      expect(later.ok()).toBe(true)
      expect((await later.json()).success).toBe(true)
    }
    await route.fulfill({ response })
  }, { times: 1 })
  await submit(page, 'x=99')
  await expect(page.getByRole('heading', { name: 'Let’s look again.' })).toBeVisible({ timeout: 150000 })
  await page.getByRole('button', { name: 'Back to my writing' }).click()
  await page.getByRole('button', { name: 'Back to learners' }).click(); await page.reload()
  const book = page.getByRole('button', { name: new RegExp(label) })
  await expect(book).toContainText('1 of 8 adventures solved')
  await book.click()
  await expect(page.getByRole('heading', { name: 'x - 8 = 15', exact: true })).toBeVisible()
})

test('prototype pages are absent from the release and the welcome has no lab link', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'For parents', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Try the drawing-only preview' })).toHaveCount(0)
  for (const path of ['/handwriting-lab', '/practice-lab']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible()
  }
})
