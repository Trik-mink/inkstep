/**
 * Collection Schemas
 *
 * All collections with columns and RBAC permissions.
 * Single source of truth — imported by both worker and frontend.
 *
 * Add schemas by creating a file in src/schemas/ and importing it here.
 */

import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema'
import { settingsSchema } from './schemas/admin-schema'
import { profilesSchema, attemptsSchema, recognitionUsageSchema } from './schemas/tutor-schema'
import { practiceSessionsSchema } from './schemas/practice-sessions-schema'

export const schemas: CollectionSchema[] = [
  usersSchema,
  settingsSchema,
  practiceSessionsSchema,
  profilesSchema, attemptsSchema, recognitionUsageSchema,
]
