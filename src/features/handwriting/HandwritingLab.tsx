import { useEffect, useRef, useState } from 'react'
import { Eraser, MoreHorizontal, PencilLine, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import { imageOf } from './ink'
import { createId } from './id'
import { recognize } from './recognition'
import { ReviewPanel } from './ReviewPanel'
import { CompanionPortrait } from './StorybookArt'
import { useNotebookPreferences } from './useNotebookPreferences'
import { BoardMenu } from './BoardMenu'
import { useNotebookLayout } from './useNotebookLayout'
import type { Rect } from './notebookLayout'
import { Whiteboard } from './Whiteboard'
import { useDraft } from './useDraft'
import { PROBLEM, type CaptureMode, type RecognitionResult, type Sample, type Scenario, type Stroke, type Submission, type Tool, type TutorNotebookConfig } from './types'
import './lab.css'

export function HandwritingLab({ tutor }: { tutor?: TutorNotebookConfig } = {}) {
  const { draft, ready, storageEnabled, storageError, change, samples, saveSample } = useDraft(tutor?.storageKey)
  const [tool, setTool] = useState<Tool>('pen')
  const [stylusOnly, setStylusOnly] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [mode, setMode] = useState<CaptureMode>(tutor ? 'live' : 'manual')
  const [scenario, setScenario] = useState<Scenario>('example')
  const [review, setReview] = useState<RecognitionResult | null>(null)
  const [expression, setExpression] = useState('')
  const [submittedImage, setSubmittedImage] = useState('')
  const [pending, setPending] = useState(false)
  const [saving, setSaving] = useState(false)
  const submissionRef = useRef<Submission | null>(null)
  const [error, setError] = useState('')
  const [undoStack, setUndoStack] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  const { companion, world, selectWorld, selectCompanion } = useNotebookPreferences(tutor?.preferenceScope)
  const [previewBounds, setPreviewBounds] = useState<Rect | null>(null)
  const [reviewElement, setReviewElement] = useState<HTMLElement | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const problemRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const checkRef = useRef<HTMLButtonElement>(null)
  const layout = useNotebookLayout(canvasRef, problemRef, draft.strokes, previewBounds, review, reviewElement, ready, drawing)
  function dismissReview() {
    setReviewOpen(false)
    checkRef.current?.focus()
  }
  const controller = useRef<AbortController | null>(null)
  const confirming = useRef(false)
  useEffect(() => () => controller.current?.abort(), [])

  function cancel() {
    controller.current?.abort()
    controller.current = null
    setPending(false)
  }
  function edit(strokes: Stroke[]) {
    setUndoStack(previous => [...previous.slice(-29), draft.strokes])
    setRedoStack([])
    change(strokes)
  }
  function resetReview() {
    cancel()
    setReview(null)
    setExpression('')
    setError('')
    setReviewOpen(false)
    setSubmittedImage('')
  }
  async function checkWork() {
    if (controller.current || drawing || !ready || (!draft.strokes.length && !(tutor && mode === 'manual'))) return
    menuRef.current?.hidePopover()
    setReviewOpen(true)
    if (review && !stale && !saved) return
    const request = new AbortController()
    controller.current = request
    setPending(true)
    setError('')
    setReview(null)
    setExpression('')
    try {
      const submission: Submission = {
        id: createId(), revision: draft.revision, problem: tutor?.problem ?? PROBLEM,
        strokes: structuredClone(draft.strokes), image: imageOf(draft.strokes, canvasRef.current?.getBoundingClientRect()),
        mode, scenario, createdAt: new Date().toISOString(),
      }
      submissionRef.current = submission
      setSubmittedImage(submission.image)
      const result = await (mode === 'live' && tutor ? tutor.recognize(submission, request.signal) : recognize(submission, request.signal))
      if (controller.current !== request || request.signal.aborted) return
      setReview(result)
      setExpression(result.candidate)
    } catch (failure) {
      if (controller.current !== request || request.signal.aborted) return
      setError(failure instanceof Error ? failure.message : 'That check did not finish. Your writing is still here.')
    } finally {
      if (controller.current === request) {
        controller.current = null
        setPending(false)
      }
    }
  }
  const stale = review !== null && review.submission.revision !== draft.revision
  const saved = review !== null && samples.some(sample => sample.submission.id === review.submission.id)
  async function confirm() {
    if (!review || stale || saved || drawing || (!tutor && samples.length >= 40) || !expression.trim() || confirming.current) return
    confirming.current = true
    const sample: Sample = {
      ...review, confirmedExpression: expression.trim(), confirmedAt: new Date().toISOString(),
      corrected: review.source !== 'manual' && expression.trim() !== review.candidate.trim(), eligibleForAccuracy: false,
    }
    try {
      setSaving(true)
      if (tutor) { await tutor.onConfirm(sample); dismissReview() }
      else if (saveSample(sample)) dismissReview()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save your step. Your writing is still here.')
    } finally { setSaving(false); confirming.current = false }
  }
  function exportCollection() {
    const collection = {
      schemaVersion: 1, app: 'Inkstep handwriting lab', exportedAt: new Date().toISOString(),
      note: 'No live recognition was performed. Manual and simulated records are not accuracy measurements.',
      samples, currentDraft: draft,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `inkstep-samples-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const bubble = error ? 'Your writing is safe.' : saved ? 'Saved. Keep exploring!' : reviewOpen ? 'Check the symbols.' : draft.strokes.length ? 'Ready when you are.' : 'Take your time.'
  return <main className="inklab" data-world={world} data-corner={layout.corner} data-drawing={drawing} data-ready={ready} aria-label="Inkstep exercise book">
    <div className="notebook-page" aria-hidden="true" />
    <header className="notebook-toolbar">
      <div className="toolbar-identity"><div><span className="wordmark">inkstep<span>.</span></span><span className="mode-status">{mode === 'live' ? 'AI reads · you confirm' : mode === 'manual' ? 'Manual · you transcribe' : 'Simulation · fixed example'}</span>{tutor?.header}{storageError && <span className="storage-warning">Session only · export work</span>}</div></div>
      <div className="board-toolbar" role="group" aria-label="Whiteboard tools">
        <button className={`tool-button ${tool === 'pen' ? 'active' : ''}`} aria-label="Pen" aria-pressed={tool === 'pen'} disabled={drawing} onClick={() => setTool('pen')}><PencilLine size={22} /></button>
        <button className={`tool-button ${tool === 'eraser' ? 'active' : ''}`} aria-label="Eraser" title="Remove an entire stroke" aria-pressed={tool === 'eraser'} disabled={drawing} onClick={() => setTool('eraser')}><Eraser size={22} /></button>
        <button className="icon-button" aria-label="Undo" data-unavailable={!undoStack.length} disabled={drawing || !undoStack.length} onClick={() => { const previous = undoStack[undoStack.length - 1]; setUndoStack(undoStack.slice(0, -1)); setRedoStack([...redoStack, draft.strokes]); change(previous) }}><RotateCcw size={22} /></button>
        <button className="icon-button" aria-label="Redo" data-unavailable={!redoStack.length} disabled={drawing || !redoStack.length} onClick={() => { const next = redoStack[redoStack.length - 1]; setRedoStack(redoStack.slice(0, -1)); setUndoStack([...undoStack, draft.strokes]); change(next) }}><RotateCw size={22} /></button>
      </div>
      <div className="toolbar-actions"><button ref={checkRef} className="primary-button check-button" data-unavailable={!ready || pending || (!draft.strokes.length && !(tutor && mode === 'manual'))} disabled={!ready || drawing || pending || saving || (!draft.strokes.length && !(tutor && mode === 'manual'))} onClick={() => void checkWork()}>Check my work</button><button className="icon-button board-menu-button" aria-label="Board menu" popoverTarget="board-menu" disabled={drawing}><MoreHorizontal size={22} /></button></div>
    </header>
    <div className="drawing-space"><Whiteboard canvasRef={canvasRef} strokes={draft.strokes} tool={tool} stylusOnly={stylusOnly} onChange={edit} onDrawingChange={setDrawing} onPreviewBoundsChange={setPreviewBounds} protectedArea={layout.exclusion} /></div>
    <div ref={problemRef} className="board-prompt"><p>Find the missing number.</p><h1>{tutor?.problem ?? PROBLEM}</h1></div>
    {layout.reserve && <aside className="companion-corner" aria-label="Reserved companion corner" data-testid="companion-reserve" onPointerDown={event => { event.preventDefault(); event.stopPropagation() }} onContextMenu={event => event.preventDefault()} style={{ left: layout.reserve.x, top: layout.reserve.y }}><div className="companion-bubble" role="status">{bubble}</div><CompanionPortrait companion={companion} /></aside>}
    {tutor?.overlay}
    <span className="folio" aria-hidden="true">01</span>
    {reviewOpen && <ReviewPanel review={review} pending={pending} error={error} stale={stale} saved={saved} drawing={drawing} full={!tutor && samples.length >= 40} expression={expression} onExpressionChange={setExpression} onConfirm={() => void confirm()} saving={saving} live={mode === 'live'} onManual={tutor ? () => {
      cancel(); setMode('manual'); setError('');
      if (submissionRef.current) { setReview({ submission: { ...submissionRef.current, mode: 'manual' }, candidate: '', elapsedMs: 0, source: 'manual' }); setExpression('') }
    } : undefined} onCancel={() => { cancel(); dismissReview() }} onDismiss={dismissReview} onRetry={() => { if (review && !stale) { setError(''); setReviewOpen(true) } else void checkWork() }} setElement={setReviewElement} placement={layout.placement} sheet={layout.measured && !layout.placement} visibleViewport={layout.visible} snapshot={review?.submission.image ?? submittedImage} />}
    {storageError && <p className="sr-only" role="alert">{storageError}</p>}
    <BoardMenu menuRef={menuRef} world={world} onWorldChange={selectWorld} companion={companion} onCompanionChange={selectCompanion} mode={mode} scenario={scenario} drawing={drawing} stylusOnly={stylusOnly} onStylusOnlyChange={setStylusOnly} onModeChange={value => { resetReview(); setMode(value) }} onScenarioChange={value => { resetReview(); setScenario(value) }} samples={samples} onExport={exportCollection} exportDisabled={!ready || (!samples.length && !draft.strokes.length)} review={review} error={error} tutorMode={!!tutor}>
      <p className="storage-status">{ready ? storageEnabled ? 'Writing saved on this device' : 'Session only; export before leaving' : 'Restoring your workspace…'}</p>
      {storageError && <p className="diagnostic-error">{storageError}</p>}
      <p className="stroke-count" data-testid="stroke-count">{draft.strokes.length} {draft.strokes.length === 1 ? 'stroke' : 'strokes'} captured</p>
      <button className="text-button clear-button" disabled={drawing || !draft.strokes.length} onClick={() => { edit([]); menuRef.current?.hidePopover() }}><Trash2 size={16} /> Clear board <span>(Undo restores it)</span></button>
    </BoardMenu>
  </main>
}
