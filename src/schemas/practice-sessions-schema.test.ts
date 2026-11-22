import { describe, expect, it } from 'vitest'
import { canCreate, canDelete, canRead, canUpdate } from 'deepspace/worker'
import { practiceSessionsSchema as schema } from './practice-sessions-schema'

// Exercise the real SDK permission evaluator rather than duplicating its logic.
const record = { recordId: 'practice-a', createdBy: 'parent-a', data: { problem: 'x + 7 = 19', response: 'x = 12' } }

describe('practice session ownership', () => {
  it.each(['member', 'admin'])('%s can create and read their own record, but cannot read another creator’s', role => {
    expect(canCreate(schema, role)).toBe(true)
    expect(canRead(schema, role, record, 'parent-a')).toBe(true)
    expect(canRead(schema, role, record, 'parent-b')).toBe(false)
  })

  it.each(['*', 'viewer', 'unrecognized-role'])('%s cannot create or read a record', role => {
    expect(canCreate(schema, role)).toBe(false)
    expect(canRead(schema, role, record, 'parent-a')).toBe(false)
  })

  it('does not treat a caller-supplied data owner as record ownership', () => {
    const forged = { ...record, data: { ...record.data, ownerId: 'parent-b', createdBy: 'parent-b' } }
    expect(canRead(schema, 'member', forged, 'parent-b')).toBe(false)
  })

  it('keeps this exercise append-only even for the creator', () => {
    for (const role of ['member', 'admin']) {
      expect(canUpdate(schema, role, record, 'parent-a')).toBe(false)
      expect(canDelete(schema, role, record, 'parent-a')).toBe(false)
    }
  })
})
