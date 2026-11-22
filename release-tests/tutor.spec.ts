import { test, expect } from 'deepspace/testing'
import type { Page } from '@playwright/test'
async function createLearner(page: Page) {
  const label = `Fox ${Date.now().toString().slice(-7)}`
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: 'Who’s exploring today?' })).toBeVisible()
  await expect(page.locator('.learner-entry')).toHaveAttribute('aria-busy', 'false')
  if (await page.getByRole('button', { name: 'Add a new notebook' }).isVisible()) await page.getByRole('button', { name: 'Add a new notebook' }).click()
  await page.getByLabel('Nickname').fill(label)
  await expect(page.getByRole('button', { name: 'Create notebook' })).toBeEnabled()
  await page.getByRole('button', { name: 'Create notebook' }).click()
  await expect(page.getByRole('heading', { name: 'x + 7 = 19', exact: true })).toBeVisible()
  return label
}
async function manual(page: Page) {
  await page.getByRole('button', { name: 'Board menu', exact: true }).click()
  await page.getByLabel('Capture method').selectOption('manual')
  await page.getByRole('button', { name: 'Close board menu', exact: true }).click()
}
async function submit(page: Page, text: string) {
  await page.getByRole('button', { name: 'Check my work', exact: true }).click()
  await page.getByLabel('Enter exactly what you wrote').fill(text)
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
}
test('complete tutoring flow persists progress and offers help only after distinct incorrect attempts', async ({ users }) => {
  const [{ page }] = await users(1)
  const label = await createLearner(page)
  await manual(page)
  await submit(page, 'x = 13')
  await expect(page.getByRole('heading', { name: 'Let’s look again.' })).toBeVisible()
  await expect(page.getByText('You’ve tried a couple of ideas.')).not.toBeVisible()
  await page.getByRole('button', { name: 'Back to my writing' }).click()
  await submit(page, 'x = 13')
  await expect(page.getByText('You’ve tried a couple of ideas.')).not.toBeVisible()
  await page.getByRole('button', { name: 'Back to my writing' }).click()
  await submit(page, 'x = 14')
  await expect(page.getByText('You’ve tried a couple of ideas.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'I’ll keep trying' }).click()
  await page.getByRole('button', { name: 'Back to my writing' }).click()
  await submit(page, 'x = 19 - 7')
  await expect(page.getByRole('heading', { name: 'That step works.' })).toBeVisible()
  await page.getByRole('button', { name: 'Give me a hint' }).click()
  await expect(page.getByText('What operation would undo adding 7?')).toBeVisible()
  await page.getByRole('button', { name: 'Back to my writing' }).click()
  await submit(page, 'x = 12')
  await expect(page.getByRole('heading', { name: 'You found it!' })).toBeVisible()
  await page.screenshot({ path: 'artifacts/tutor-solved.png' })
  await page.getByRole('button', { name: 'Next adventure' }).click()
  await expect(page.getByRole('heading', { name: 'x - 8 = 15', exact: true })).toBeVisible()
  await page.reload()
  const learner = page.getByRole('button', { name: new RegExp(label) })
  await expect(learner).toContainText('1 of 8 adventures solved')
  await learner.click()
  await expect(page.getByRole('heading', { name: 'x - 8 = 15', exact: true })).toBeVisible()
})

test('live handwriting is transcribed through DeepSpace before the student confirms it', async ({ users }) => {
  test.skip(process.env.INKSTEP_LIVE_VISION !== '1', 'Opt-in: one real billed vision request.')
  const [{ page }] = await users(1)
  await createLearner(page)
  const box = (await page.getByTestId('whiteboard').boundingBox())!
  const x = box.x + box.width * .22, y = box.y + box.height * .45, s = 40
  const strokes = [
    [[0, 0], [1, 1]], [[1, 0], [0, 1]],
    [[1.6, .3], [2.4, .3]], [[1.6, .7], [2.4, .7]],
    [[3, .2], [3.3, 0], [3.3, 1]],
    [[4, .2], [4.2, 0], [4.7, 0], [4.9, .2], [4.7, .5], [4, 1], [4.9, 1]],
  ]
  for (const points of strokes) {
    await page.mouse.move(x + points[0][0] * s, y + points[0][1] * s)
    await page.mouse.down()
    for (const p of points.slice(1)) await page.mouse.move(x + p[0] * s, y + p[1] * s, { steps: 5 })
    await page.mouse.up()
  }
  await page.screenshot({ path: 'artifacts/tutor-writing.png' })
  await page.getByRole('button', { name: 'Check my work', exact: true }).click()
  const expression = page.getByLabel('Does this match your writing?')
  await expect(expression).toBeVisible({ timeout: 45000 })
  await expect(expression).toHaveValue(/x\s*=\s*12/)
  await expect(page.getByRole('heading', { name: 'You found it!' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await expect(page.getByRole('heading', { name: 'You found it!' })).toBeVisible()
})

test('recognition failure falls back to typing without losing the student’s progress', async ({ users }) => {
  const [{ page }] = await users(1)
  await createLearner(page)
  const box = (await page.getByTestId('whiteboard').boundingBox())!
  await page.mouse.click(box.x + box.width * .4, box.y + box.height * .5)
  await page.route('**/api/actions/tutor-read', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Handwriting recognition is unavailable. Type your step to keep learning.' }) }))
  await page.getByRole('button', { name: 'Check my work', exact: true }).click()
  await page.getByRole('button', { name: 'Type instead' }).click()
  await page.getByLabel('Enter exactly what you wrote').fill('x = 12')
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await expect(page.getByRole('heading', { name: 'You found it!' })).toBeVisible()
})

test('signed-out actions and unbounded direct paid integration calls are denied', async ({ request }) => {
  const action = await request.post('/api/actions/tutor-read', { data: { profileId: 'foreign', image: 'data:image/png;base64,aGVsbG8=' } })
  expect(action.status()).toBe(401)
  const direct = await request.post('/api/integrations/anthropic/chat-completion', { data: { messages: [] } })
  expect(direct.status()).toBe(403)
  const other = await request.post('/api/integrations/openai/chat-completion', { data: { messages: [] } })
  expect(other.status()).toBe(403)
})

test('a failed progress save can be retried without rereading handwriting', async ({ users }) => {
  const [{ page }] = await users(1)
  await createLearner(page)
  await manual(page)
  let calls = 0
  await page.route('**/api/actions/tutor-grade', async route => {
    calls++
    if (calls === 1) await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Temporary save failure. Try again.' }) })
    else await route.continue()
  })
  await submit(page, 'x = 12')
  await expect(page.getByRole('heading', { name: 'The check didn’t finish.' })).toBeVisible()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByLabel('Enter exactly what you wrote')).toHaveValue('x = 12', { timeout: 3000 })
  await page.getByRole('button', { name: 'Confirm & save sample' }).click()
  await expect(page.getByRole('heading', { name: 'You found it!' })).toBeVisible()
  expect(calls).toBe(2)
})
