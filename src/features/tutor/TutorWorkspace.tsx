import { useRef, useState } from 'react'
import { useAuthProfileReady, useMutations, useQuery } from 'deepspace'
import { learnerPreferenceScope } from '../handwriting/useNotebookPreferences'
import { HandwritingLab } from '../handwriting/HandwritingLab'
import type { RecognitionResult, Submission } from '../handwriting/types'
import type { LearnerProfile, TutorAttempt } from '../../schemas/tutor-schema'
import { PROBLEMS } from './math'
import { tutorAction } from './client'
import { LearnerPicker } from './LearnerPicker'
import { TutorFeedback, type Feedback } from './TutorFeedback'
import './tutor.css'
export function TutorWorkspace() {
  const { user } = useAuthProfileReady({ requireUser: true })
  const profiles = useQuery<LearnerProfile>('learner_profiles', { orderBy: 'createdAt', orderDir: 'asc' })
  const attempts = useQuery<TutorAttempt>('tutor_attempts', { orderBy: 'createdAt', orderDir: 'desc', limit: 100 })
  const solved = useQuery<TutorAttempt>('tutor_attempts', { where: { kind: 'solved' } })
  const { createConfirmed, ready } = useMutations<LearnerProfile>('learner_profiles')
  const [profileId, setProfileId] = useState('')
  const [problemIndex, setProblemIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const active = useRef(profileId); active.current = profileId
  const profile = profiles.records.find(p => p.recordId === profileId)
  const problem = PROBLEMS[problemIndex]
  if (profiles.status === 'error' || attempts.status === 'error' || solved.status === 'error') return <div className="learner-picker" role="alert"><h1>Your notebook could not open.</h1><p>{profiles.error ?? attempts.error ?? solved.error}</p><button onClick={() => location.reload()}>Try again</button></div>
  if (!profile) return <LearnerPicker parentId={user?.id ?? ""} profiles={profiles.records} attempts={attempts.records} solvedAttempts={solved.records} ready={ready && profiles.status === 'ready' && attempts.status === 'ready' && solved.status === 'ready'} onCreate={async label => { const id = await createConfirmed({ label }); setProfileId(id); setProblemIndex(0) }} onSelect={(id, solvedIds) => {
    const solved = new Set(solvedIds)
    const next = PROBLEMS.findIndex(p => !solved.has(p.id))
    setProfileId(id); setProblemIndex(Math.max(0, next)); setFeedback(null)
  }} />
  async function recognize(submission: Submission, signal: AbortSignal): Promise<RecognitionResult> {
    const start = performance.now()
    const result = await tutorAction<{ candidate: string; uncertain: boolean }>('tutor-read', { profileId, image: submission.image }, signal)
    return { submission, candidate: result.candidate, elapsedMs: Math.round(performance.now() - start), source: 'live' }
  }
  return <div className="tutor-shell"><HandwritingLab key={`${profileId}:${problem.id}`} tutor={{
    problem: problem.expression,
    preferenceScope: learnerPreferenceScope(user?.id ?? "", profileId),
    storageKey: `inkstep:tutor:${user?.id}:${profileId}:${problem.id}`,
    header: <button type="button" className="tutor-profile-back" onClick={() => { setProfileId(''); setFeedback(null) }} aria-label="Back to learners">‹ {profile.data.label} · {problemIndex + 1}/8</button>,
    recognize,
    onConfirm: async sample => {
      const selectedProfile = profileId
      const result = await tutorAction<Feedback>('tutor-grade', { profileId, problemId: problem.id, submissionId: sample.submission.id, response: sample.confirmedExpression })
      if (active.current === selectedProfile) setFeedback(result)
    },
    overlay: feedback && <TutorFeedback key={`${feedback.recordId}:${feedback.normalized}`} feedback={feedback} problem={problem} onClose={() => setFeedback(null)} onNext={() => { setFeedback(null); setProblemIndex(index => (index + 1) % PROBLEMS.length) }} />,
  }} /></div>
}
