import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import type { RecognitionResult } from './types'
import type { Rect } from './notebookLayout'

type Props = {
  saving?: boolean
  live?: boolean
  onManual?: () => void
  review: RecognitionResult | null
  pending: boolean
  error: string
  stale: boolean
  saved: boolean
  drawing: boolean
  full: boolean
  expression: string
  onExpressionChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
  onDismiss: () => void
  onRetry: () => void
  setElement: (element: HTMLElement | null) => void
  placement: Rect | null
  sheet: boolean
  visibleViewport: Rect
  snapshot: string
}

export function ReviewPanel({ saving = false, live = false, onManual, review, pending, error, stale, saved, drawing, full, expression, onExpressionChange, onConfirm, onCancel, onDismiss, onRetry, setElement, placement, sheet, visibleViewport, snapshot }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [element, setLocalElement] = useState<HTMLElement | null>(null)
  const attach = useCallback((node: HTMLElement | null) => { setLocalElement(node); setElement(node) }, [setElement])
  const submissionId = review?.submission.id
  useEffect(() => {
    if (sheet && element instanceof HTMLDialogElement && !element.open) element.showModal()
    if (document.querySelector(':popover-open') || drawing) return
    if (submissionId) inputRef.current?.focus({ preventScroll: true })
    else element?.focus({ preventScroll: true })
  }, [submissionId, drawing, element, sheet])
  const Panel = sheet ? 'dialog' : 'section'
  const title = pending ? live ? 'Reading your step…' : 'Trying a sample response' : error ? 'The check didn’t finish.' : 'Is this what you wrote?'
  return <Panel ref={attach} className={sheet ? 'review-sheet' : 'review-panel'} role="dialog" aria-modal={sheet} aria-label="Read your writing" tabIndex={-1}
    style={sheet ? { top: visibleViewport.y + 8, left: visibleViewport.x + 12, width: visibleViewport.width - 24, maxHeight: visibleViewport.height - 16 } : { left: placement?.x, top: placement?.y }}
    onCancel={event => { event.preventDefault(); onDismiss() }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onDismiss() } }}>
    {sheet && snapshot && <img className="sheet-snapshot" src={snapshot} alt="Submitted handwriting preserved for review" />}
    <div className="review-content" role={error ? 'alert' : undefined}>
      <h2 className="review-title">{title}</h2>
      <div className="feedback-row">
        {pending ? <><LoaderCircle className="spin" size={22} /><button className="text-button" onClick={onCancel}>Cancel request</button></>
          : error ? <><p className="error-message">Your writing is still here.</p><button className="primary-button retry-button" disabled={saving} onClick={onRetry}>Try again</button>{onManual && <button className="text-button" onClick={onManual}>Type instead</button>}</>
            : review && <><label className="sr-only" htmlFor="expression">{review.source === 'manual' ? 'Enter exactly what you wrote' : 'Does this match your writing?'}</label><input ref={inputRef} id="expression" className="expression-input" value={expression} onChange={event => onExpressionChange(event.target.value)} maxLength={200} autoComplete="off" spellCheck={false} placeholder="Your writing" /><button className="primary-button confirm-button" aria-label="Confirm & save sample" disabled={saving || !expression.trim() || stale || saved || drawing || full} onClick={onConfirm}>{saving ? 'Saving…' : 'Confirm'}</button></>}
        <button className="icon-button dismiss-button" aria-label="Back to writing" onClick={onDismiss}><X size={20} /></button>
      </div>
      <p className="source-label">{live ? 'AI transcription · confirm the symbols before math checking' : pending || error ? 'Simulation · no recognition service' : review?.source === 'live' ? 'AI transcription · confirm the symbols' : review?.source === 'simulation' ? 'Scripted response - does not read your ink' : 'Manual transcription - no recognition service'}</p>
      {stale && <p className="stale-note" role="status">Your board changed. Check your work again to review the new version.</p>}
      {full && !saved && <p className="stale-note">This session has 40 samples. Export them before starting a new collection.</p>}
    </div>
  </Panel>
}
