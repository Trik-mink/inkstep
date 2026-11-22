import type { CollectionSchema } from 'deepspace/schema'

export type PracticeSession = { problem: string; response: string }
export const PRACTICE_COLLECTION = 'practice_sessions'

// The server stamps createdBy. The browser does not supply an owner ID.
// App scope selects the room; 'own' limits rows within that shared room.
export const practiceSessionsSchema: CollectionSchema = {
  name: PRACTICE_COLLECTION,
  columns: [
    { name: 'problem', storage: 'text', interpretation: 'plain', required: true, maxLength: 100 },
    { name: 'response', storage: 'text', interpretation: 'plain', required: true, maxLength: 200 },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: false, delete: false },
    admin: { read: 'own', create: true, update: false, delete: false },
  },
}
