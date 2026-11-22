import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { gradeAttempt, readHandwriting } from './tutor'
export const actions: Record<string, ActionHandler<Env>> = {
  'tutor-grade': gradeAttempt,
  'tutor-read': readHandwriting,
}
