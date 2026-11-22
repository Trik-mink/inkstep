import { test, expect, loadAllTestAccounts } from 'deepspace/testing'

test.skip(loadAllTestAccounts().length < 2, 'Needs two usable DeepSpace test accounts to verify persistence and account isolation.')

test('practice record survives reload and is not returned to another account', async ({ users }) => {
  const [a, b] = await users(2)
  await a.page.goto('/practice-lab')
  const save = a.page.getByRole('button', { name: 'Save practice record', exact: true })
  await expect(save).toBeEnabled()
  await a.page.getByLabel('Example answer').fill('x = 12')
  await save.click()
  const acknowledgement = a.page.getByTestId('practice-save-result')
  await expect(acknowledgement).toContainText('Server confirmed record:')
  const createdRecord = a.page.locator('[data-record-id]').first()
  await expect(createdRecord).toBeVisible()
  const id = (await acknowledgement.textContent())!.match(/Server confirmed record: (.+)\. Note this ID/)![1]
  const ownRow = a.page.locator('[data-record-id]').filter({ hasText: id })
  await expect(ownRow).toContainText('x = 12')
  const userId = (await a.page.getByTestId('practice-user-id').textContent())!
  await expect(ownRow).toContainText(`Created by: ${userId}`)
  await a.page.reload()
  await expect(a.page.locator('[data-record-id]').filter({ hasText: id })).toContainText('x = 12')
  await b.page.goto('/practice-lab')
  await expect(b.page.getByRole('button', { name: 'Save practice record', exact: true })).toBeEnabled()
  await expect(b.page.getByTestId('practice-query-status')).toHaveText('ready')
  await expect(b.page.getByTestId('practice-user-id')).not.toHaveText(userId)
  await expect(b.page.getByTestId('practice-records')).not.toContainText(id)
})
