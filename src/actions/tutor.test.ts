import { describe, expect, it, vi } from 'vitest'
import type { ActionContext } from 'deepspace/worker'
import type { Env } from '../../worker'
import { gradeAttempt, readHandwriting } from './tutor'
import type { TutorAttempt } from '../schemas/tutor-schema'

function context(params: Record<string, unknown>, owner = 'parent-a') {
  const rows: { recordId: string; createdBy: string; data: Record<string, unknown> }[] = []
  const integration = vi.fn(async () => ({ success: true, data: { content: [{ type: 'text', text: '{"expression":"x=12","uncertain":false}' }] } }))
  const ctx = {
    userId: 'parent-a', params, env: {} as Env, callerJwt: 'test-fixture-not-a-token',
    tools: {
      get: vi.fn(async () => ({ success: true, data: { record: { recordId: 'learner-a', createdBy: owner, data: { label: 'Fox' } } } })),
      query: vi.fn(async (collection: string) => ({ success: true, data: { records: rows.filter(r => collection === 'tutor_attempts' ? 'kind' in r.data : 'slot' in r.data).slice().reverse(), count: rows.length } })),
      create: vi.fn(async (collection: string, data: Record<string, unknown>, id?: string) => {
        const recordId = id ?? `${collection}-${rows.length}`
        const index = rows.findIndex(r => r.recordId === recordId)
        const row = { recordId, createdBy: 'parent-a', data }
        if (index >= 0) rows[index] = row; else rows.push(row)
        return { success: true, data: { recordId } }
      }), integration,
    },
  } as unknown as ActionContext<Env>
  return { ctx, rows, integration }
}
const input = { profileId: 'learner-a', problemId: 'add-7', submissionId: 'submission-a', response: 'x=13' }

describe('server tutor actions', () => {
  it('refuses a foreign profile before grading, storage, or a billed integration', async () => {
    const { ctx, rows, integration } = context(input, 'parent-b')
    expect((await gradeAttempt(ctx)).success).toBe(false)
    ctx.params = { profileId: 'learner-a', image: 'data:image/png;base64,aGVsbG8=' }
    expect((await readHandwriting(ctx)).success).toBe(false)
    expect(rows).toHaveLength(0)
    expect(integration).not.toHaveBeenCalled()
  })
  it('grades on the server, deduplicates retries, and counts only distinct wrong answers', async () => {
    const { ctx, rows } = context({ ...input, answer: 13, kind: 'solved' })
    const first = await gradeAttempt(ctx)
    expect(first.success && first.data).toMatchObject({ kind: 'incorrect', streak: 1 })
    await gradeAttempt(ctx)
    ctx.params = { ...input, submissionId: 'another-snapshot' }
    await gradeAttempt(ctx)
    expect(rows).toHaveLength(1)
    ctx.params = { ...input, submissionId: 'new', response: 'x=14' }
    const second = await gradeAttempt(ctx)
    expect(second.success && second.data).toMatchObject({ kind: 'incorrect', streak: 2 })
    ctx.params = { ...input, response: 'x=12' }
    const solved = await gradeAttempt(ctx)
    expect(solved.success && solved.data).toMatchObject({ kind: 'solved', streak: 0, persisted: true })
    expect((rows[2].data as TutorAttempt).kind).toBe('solved')
  })
  it('does not persist unsupported formats or a copied problem as wrong attempts', async () => {
    const { ctx, rows } = context({ ...input, response: 'x*x=144' })
    const result = await gradeAttempt(ctx)
    expect(result.success && result.data).toMatchObject({ kind: 'unsupported', persisted: false })
    ctx.params = { ...input, response: 'x+7=19' }
    await gradeAttempt(ctx)
    expect(rows).toHaveLength(0)
  })
  it('reserves a bounded daily read slot before calling the fixed vision model', async () => {
    const { ctx, rows, integration } = context({ profileId: 'learner-a', image: 'data:image/png;base64,aGVsbG8=' })
    for (let i = 0; i < 30; i++) expect((await readHandwriting(ctx)).success).toBe(true)
    expect(rows).toHaveLength(30)
    expect((await readHandwriting(ctx)).success).toBe(false)
    expect(integration).toHaveBeenCalledTimes(30)
  })
  it('returns an editable empty transcription when the model is uncertain', async () => {
    const { ctx, integration } = context({ profileId: 'learner-a', image: 'data:image/png;base64,aGVsbG8=' })
    integration.mockResolvedValue({ success: true, data: { content: [{ type: 'text', text: '{"expression":"x=99","uncertain":true}' }] } })
    const result = await readHandwriting(ctx)
    expect(result.success && result.data).toEqual({ candidate: '', uncertain: true })
  })
})
