import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Plus, X } from 'lucide-react'
import { PROBLEMS } from './math'
import { learnerPreferenceScope, useNotebookPreferences } from '../handwriting/useNotebookPreferences'
import type { RecordData } from 'deepspace'
import type { LearnerProfile, TutorAttempt } from '../../schemas/tutor-schema'
import { CompanionPortrait } from '../handwriting/StorybookArt'
import { NotebookScene } from './NotebookScene'
import './entry.css'

export function LearnerPicker({ parentId, profiles, attempts, solvedAttempts, ready, onCreate, onSelect }: { parentId: string; profiles: RecordData<LearnerProfile>[]; attempts: RecordData<TutorAttempt>[]; solvedAttempts: RecordData<TutorAttempt>[]; ready: boolean; onCreate: (label: string) => Promise<void>; onSelect: (id: string, solvedIds: string[]) => void }) {
  const [label, setLabel] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const lock = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (creating) input.current?.focus() }, [creating])
  async function create(event: FormEvent) {
    event.preventDefault()
    if (lock.current || !label.trim() || !ready) return
    lock.current = true; setPending(true); setError('')
    try { await onCreate(label.trim()); setLabel(''); setCreating(false) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not create this learner. Try again.') }
    finally { setPending(false); lock.current = false }
  }
  const form = <form onSubmit={event => void create(event)} className="learner-create" aria-labelledby="new-notebook-title">
    <div className="create-heading"><h2 id="new-notebook-title">A notebook of your own.</h2>{!!profiles.length && <button type="button" className="create-close" disabled={pending} aria-label="Close new notebook form" onClick={() => { setCreating(false); addButton.current?.focus() }}><X size={18} /></button>}</div>
    <label htmlFor="learner-label">Nickname</label><input ref={input} id="learner-label" required maxLength={24} value={label} disabled={pending} onChange={event => setLabel(event.target.value)} placeholder="Little Fox, perhaps?" />
    <button type="submit" className="tutor-primary" disabled={!ready || pending || !label.trim()}>{pending ? 'Creating…' : 'Create notebook'}</button>
    <small>For parents: use a nickname. Children share your account and don’t need their own sign-in.</small>{error && <p role="alert">{error}</p>}
  </form>
  return <div className="learner-entry" aria-busy={!ready}><div className="learner-entry-inner">
    <header className="learner-entry-header"><div><p className="tutor-kicker">Your family’s little library</p><h1>Who’s exploring today?</h1><p>{profiles.length ? 'Pick your notebook. Your next adventure is waiting.' : 'Every explorer starts with a notebook of their own.'}</p></div>{!!profiles.length && <NotebookScene compact />}</header>
    {!ready ? <p className="entry-load" role="status">Opening your family’s notebook…</p> : !profiles.length ? <div className="learner-entry-empty"><NotebookScene />{form}</div> : <>
      <div className="notebook-shelf" aria-label="Learner notebooks">{profiles.map(profile => <LearnerBook key={profile.recordId} parentId={parentId} profile={profile} solvedAttempts={solvedAttempts} pending={pending} onSelect={onSelect} />)}<button ref={addButton} type="button" className="new-notebook" aria-expanded={creating} aria-controls="new-notebook-form" onClick={() => setCreating(true)}><Plus size={24} strokeWidth={1.5} /><span>Add a new notebook</span><small>For another little explorer</small></button></div>
      <div id="new-notebook-form">{creating && form}</div>
    </>}
    <details className="learner-parent-options"><summary>For parents · progress &amp; details</summary>
      <p>English, grades 3–4. Eight focused missing-number problems. AI can misread handwriting, so learners always confirm the symbols before math checking.</p>
      <p>Learner notebooks belong to this signed-in parent account. Switching notebooks is not a separate child sign-in.</p>
      {!!attempts.length && <section className="tutor-history"><h2>Recent discoveries</h2><ul>{attempts.slice(0, 8).map(a => <li key={a.recordId}><strong>{profiles.find(p => p.recordId === a.data.profileId)?.data.label ?? 'Learner'}</strong><span>{a.data.response}</span><small>{a.data.kind === 'solved' ? 'Solved' : a.data.kind === 'equivalent' ? 'Valid step' : 'Practicing'}</small></li>)}</ul></section>}
    </details>
  </div></div>
}

function LearnerBook({ parentId, profile, solvedAttempts, pending, onSelect }: { parentId: string; profile: RecordData<LearnerProfile>; solvedAttempts: RecordData<TutorAttempt>[]; pending: boolean; onSelect: (id: string, solvedIds: string[]) => void }) {
  const solved = new Set(solvedAttempts.filter(attempt => attempt.data.profileId === profile.recordId).map(attempt => attempt.data.problemId))
  const solvedIds = PROBLEMS.filter(problem => solved.has(problem.id)).map(problem => problem.id)
  const { companion } = useNotebookPreferences(learnerPreferenceScope(parentId, profile.recordId))
  return <button type="button" className="learner-book" data-profile-id={profile.recordId} disabled={pending} onClick={() => onSelect(profile.recordId, solvedIds)}>
    <span className="book-cover-label">A math adventure</span><span className="book-companion"><CompanionPortrait companion={companion} decorative /></span>
    <strong>{profile.data.label}</strong><span className="book-progress">{solvedIds.length} of 8 adventures solved</span>
    <span className="book-stars" aria-hidden="true">{PROBLEMS.map((problem, index) => <i key={problem.id} className={index < solvedIds.length ? 'is-solved' : ''} />)}</span>
    <span className="book-open-label">{solvedIds.length ? 'Keep exploring' : 'Let’s begin'} <ArrowRight size={13} className="book-open-arrow" /></span>
  </button>
}
