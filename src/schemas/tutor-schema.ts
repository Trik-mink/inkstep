import type { CollectionSchema } from 'deepspace/schema'
import type { StepKind } from '../features/tutor/math'
export type LearnerProfile = { label: string }
export type TutorAttempt = { profileId: string; problemId: string; submissionId: string; response: string; normalized: string; kind: StepKind; message: string; streak: number }
const denied = { read: false, create: false, update: false, delete: false } as const
export const profilesSchema: CollectionSchema = {
  name: 'learner_profiles',
  columns: [{ name: 'label', storage: 'text', interpretation: 'plain', required: true, maxLength: 24 }],
  permissions: { '*': denied, viewer: denied, member: { ...denied, read: 'own', create: true }, admin: { ...denied, read: 'own', create: true } },
}
export const attemptsSchema: CollectionSchema = {
  name: 'tutor_attempts',
  columns: [
    ...['profileId', 'problemId', 'submissionId', 'response', 'normalized', 'kind', 'message'].map(name => ({ name, storage: 'text' as const, interpretation: 'plain', required: true, maxLength: name === 'message' ? 400 : 200 })),
    { name: 'streak', storage: 'number', interpretation: 'plain', required: true },
  ],
  uniqueOn: ['profileId', 'problemId', 'submissionId', 'normalized'],
  permissions: { '*': denied, viewer: denied, member: { ...denied, read: 'own' }, admin: { ...denied, read: 'own' } },
}
export const recognitionUsageSchema: CollectionSchema = {
  name: 'recognition_usage',
  columns: [
    { name: 'userId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'day', storage: 'text', interpretation: 'plain', required: true },
    { name: 'slot', storage: 'number', interpretation: 'plain', required: true },
  ],
  uniqueOn: ['userId', 'day', 'slot'],
  permissions: { '*': denied, viewer: denied, member: denied, admin: denied },
}
