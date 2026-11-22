import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'
import { boundsOnCanvas, chooseCompanionCorner, companionRect, findFeedbackPosition, strokeRectangles, type Corner, type Rect } from './notebookLayout'
import { BOARD_HEIGHT, BOARD_WIDTH, type RecognitionResult, type Stroke } from './types'

const empty: Rect = { x: 0, y: 0, width: 0, height: 0 }
function rectOf(element: Element): Rect {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}
function same(a: Rect, b: Rect) { return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height }

export function useNotebookLayout(canvasRef: RefObject<HTMLCanvasElement | null>, problemRef: RefObject<HTMLDivElement | null>,
  strokes: Stroke[], preview: Rect | null, review: RecognitionResult | null, reviewElement: HTMLElement | null, ready: boolean, drawing: boolean) {
  const [screen, setScreen] = useState(empty)
  const [anchor, setAnchor] = useState<{ width: number; height: number; corner: Corner | 'margin' } | null>(null)
  const [canvas, setCanvas] = useState(empty)
  const [problem, setProblem] = useState(empty)
  const [visible, setVisible] = useState(empty)
  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      if (canvasRef.current) { const next = rectOf(canvasRef.current); setCanvas(old => same(old, next) ? old : next) }
      if (problemRef.current) { const next = rectOf(problemRef.current); setProblem(old => same(old, next) ? old : next) }
      const screenRect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
      setScreen(old => same(old, screenRect) ? old : screenRect)
      const viewport = window.visualViewport
      const next = { x: viewport?.offsetLeft ?? 0, y: viewport?.offsetTop ?? 0, width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight }
      setVisible(old => same(old, next) ? old : next)
      if (!reviewElement) setPanelSize(null)
      if (reviewElement?.classList.contains('review-panel')) {
        const { width, height } = rectOf(reviewElement)
        if (width && height) setPanelSize(old => old?.width === width && old.height === height ? old : { width, height })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const element of [canvasRef.current, problemRef.current, reviewElement]) if (element) observer.observe(element)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('scroll', measure) }
  }, [canvasRef, problemRef, reviewElement])
  const ink = useMemo(() => strokeRectangles(strokes, canvas), [strokes, canvas])
  const occupiedInk = preview ? [...ink, boundsOnCanvas(preview, canvas)] : ink
  // Select a safe place only on restore or orientation/viewport changes, never in response to writing.
  useLayoutEffect(() => {
    if (!ready || drawing || !canvas.width || !problem.width || !screen.width) return
    if (anchor?.width === screen.width && anchor.height === screen.height) return
    setAnchor({ width: screen.width, height: screen.height, corner: chooseCompanionCorner(canvas, [...ink, problem]) ?? 'margin' })
  }, [ready, drawing, canvas, problem, screen, ink, anchor])
  const corner = anchor?.corner ?? 'bottom-right'
  const reserve = corner === 'margin'
    ? { x: canvas.x + canvas.width + 16, y: canvas.y + canvas.height - 104, width: 216, height: 104 }
    : companionRect(canvas, corner)
  const exclusion = corner === 'margin' || !canvas.width ? null : {
    x: (reserve.x - canvas.x) / canvas.width * BOARD_WIDTH, y: (reserve.y - canvas.y) / canvas.height * BOARD_HEIGHT,
    width: reserve.width / canvas.width * BOARD_WIDTH, height: reserve.height / canvas.height * BOARD_HEIGHT,
  }
  const submitted = useMemo(() => strokeRectangles(review?.submission.strokes ?? strokes, canvas), [review, strokes, canvas])
  const safeCanvas = { x: Math.max(canvas.x, visible.x + 8), y: Math.max(canvas.y, visible.y + 8),
    width: Math.max(0, Math.min(canvas.x + canvas.width, visible.x + visible.width - 8) - Math.max(canvas.x, visible.x + 8)),
    height: Math.max(0, Math.min(canvas.y + canvas.height, visible.y + visible.height - 8) - Math.max(canvas.y, visible.y + 8)) }
  const placement = findFeedbackPosition(safeCanvas, { width: visible.width <= 700 ? Math.max(0, visible.width - 48) : 400, height: panelSize?.height ?? 116 }, submitted, [...occupiedInk, problem, ...(reserve ? [reserve] : [])])
  return { canvas, corner, reserve, exclusion, placement, visible, measured: canvas.width > 0 }
}
