import { useEffect, useRef, useState } from 'react'
import { hintFor, type Problem, type StepResult } from './math'
export type Feedback = StepResult & { streak: number; persisted: boolean; recordId?: string }
export function TutorFeedback({ feedback, problem, onClose, onNext }: { feedback: Feedback; problem: Problem; onClose: () => void; onNext: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [declined, setDeclined] = useState(false)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className="tutor-feedback" onCancel={onClose} aria-labelledby="feedback-title">
    <p className="tutor-kicker">{feedback.kind === 'solved' ? 'A little discovery' : 'One step at a time'}</p>
    <h2 id="feedback-title">{feedback.kind === 'solved' ? 'You found it!' : feedback.kind === 'equivalent' ? 'That step works.' : feedback.kind === 'incorrect' ? 'Let’s look again.' : 'Let’s check your step.'}</h2>
    <p className="tutor-written">{feedback.normalized}</p><p>{feedback.message}</p>
    {hintLevel > 0 && <p className="tutor-hint" role="status">{hintFor(problem, hintLevel)}</p>}
    {feedback.kind !== 'solved' && <div className="tutor-help">
      {feedback.streak >= 2 && !declined && !hintLevel && <p>You’ve tried a couple of ideas. Would you like a small hint?</p>}
      <button type="button" onClick={() => setHintLevel(level => Math.min(2, level + 1))}>{hintLevel ? 'Another hint' : 'Give me a hint'}</button>
      {feedback.streak >= 2 && !declined && !hintLevel && <button type="button" onClick={() => setDeclined(true)}>I’ll keep trying</button>}
    </div>}
    <div className="tutor-feedback-actions"><button type="button" className="tutor-primary" onClick={feedback.kind === 'solved' ? onNext : onClose}>{feedback.kind === 'solved' ? 'Next adventure' : 'Back to my writing'}</button></div>
    <small>{feedback.persisted ? 'Your confirmed step is saved to this learner’s progress.' : 'This did not count as a wrong attempt.'}</small>
  </dialog>
}
