import { expect, it } from 'vitest'
import { canCreate, canRead, canUpdate } from 'deepspace/worker'
import { profilesSchema, attemptsSchema, recognitionUsageSchema } from './tutor-schema'
const record = { createdBy: 'parent-a', data: { label: 'Fox' } }
it('keeps learner profiles private to the creator, including for room admins', () => {
  for (const role of ['member', 'admin']) {
    expect(canCreate(profilesSchema, role)).toBe(true)
    expect(canRead(profilesSchema, role, record, 'parent-a')).toBe(true)
    expect(canRead(profilesSchema, role, record, 'parent-b')).toBe(false)
  }
})
it('allows reading own progress but refuses client-forged grades and edits', () => {
  for (const role of ['member', 'admin']) {
    expect(canRead(attemptsSchema, role, record, 'parent-a')).toBe(true)
    expect(canRead(attemptsSchema, role, record, 'parent-b')).toBe(false)
    expect(canCreate(attemptsSchema, role)).toBe(false)
    expect(canUpdate(attemptsSchema, role, record, 'parent-a')).toBe(false)
  }
})
it('does not expose or accept client writes to recognition quota records', () => {
  for (const role of ['*', 'viewer', 'member', 'admin']) {
    expect(canRead(recognitionUsageSchema, role, record, 'parent-a')).toBe(false)
    expect(canCreate(recognitionUsageSchema, role)).toBe(false)
  }
})
