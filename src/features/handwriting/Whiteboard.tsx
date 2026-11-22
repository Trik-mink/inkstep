import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { eraseAt, paintInk } from './ink'
import { createId } from './id'
import { clipBeforeRect, insideRect } from './penBoundary'
import { extendBounds, type Rect } from './notebookLayout'
import { BOARD_HEIGHT, BOARD_WIDTH, type Point, type Stroke, type Tool } from './types'

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  strokes: Stroke[]
  tool: Tool
  stylusOnly: boolean
  onChange: (strokes: Stroke[]) => void
  onDrawingChange: (drawing: boolean) => void
  protectedArea: Rect | null
  onPreviewBoundsChange: (bounds: Rect | null) => void
}

type Gesture = { pointerId: number; stroke: Stroke; original: Stroke[]; preview: Stroke[]; bounds: Rect; lastPoint: Point; exclusion: Rect | null; stopped: boolean }

export function Whiteboard({ canvasRef, strokes, tool, stylusOnly, onChange, onDrawingChange, onPreviewBoundsChange, protectedArea }: Props) {
  const gesture = useRef<Gesture | null>(null)
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes

  const redraw = useCallback((drawing = strokesRef.current) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    const ratio = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(canvas.width / BOARD_WIDTH, 0, 0, canvas.height / BOARD_HEIGHT, 0, 0)
    paintInk(ctx, drawing)
  }, [canvasRef])

  useEffect(() => { redraw(strokes) }, [strokes, redraw])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const current = gesture.current
      redraw(current ? [...current.preview, ...(tool === 'pen' ? [current.stroke] : [])] : strokesRef.current)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [canvasRef, redraw, tool])

  function location(event: PointerEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(BOARD_WIDTH, (event.clientX - rect.left) / rect.width * BOARD_WIDTH)),
      y: Math.max(0, Math.min(BOARD_HEIGHT, (event.clientY - rect.top) / rect.height * BOARD_HEIGHT)),
      pressure: Math.max(0, Math.min(1, event.pressure || 0.5)),
      time: event.timeStamp,
    }
  }

  function recordPoint(current: Gesture, point: Point) {
    if (current.stopped) return
    const boundary = current.exclusion ? clipBeforeRect(current.lastPoint, point, current.exclusion) : null
    const next = boundary ?? point
    if (tool === 'pen') {
      current.stroke.points.push(next)
      current.bounds = extendBounds(current.bounds, next)
    } else current.preview = eraseAt(current.preview, next)
    current.lastPoint = next
    if (boundary) current.stopped = true
  }

  function finish(cancelled: boolean) {
    const current = gesture.current
    if (!current) return
    gesture.current = null
    onDrawingChange(false)
    onPreviewBoundsChange(null)
    if (cancelled) {
      redraw(current.original)
      return
    }
    const next = tool === 'pen' ? [...current.original, current.stroke] : current.preview
    redraw(next)
    if (next.length !== current.original.length || tool === 'pen') onChange(next)
  }

  return (
    <div className={`ink-board ${tool === 'eraser' ? 'is-erasing' : ''}`}>
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        aria-label="Handwriting whiteboard"
        data-testid="whiteboard"
        onPointerDown={event => {
          if (gesture.current || event.button !== 0 || (stylusOnly && event.pointerType === 'touch')) return
          event.preventDefault()
          const point = location(event.nativeEvent)
          // Account for the round pen tip as well as its center point.
          const exclusion = protectedArea ? { x: protectedArea.x - 2, y: protectedArea.y - 2, width: protectedArea.width + 4, height: protectedArea.height + 4 } : null
          if (exclusion && insideRect(point, exclusion)) return
          const original = strokesRef.current
          const preview = tool === 'eraser' ? eraseAt(original, point) : original
          gesture.current = {
            pointerId: event.pointerId,
            stroke: { id: createId(), points: [point] },
            original,
            preview,
            bounds: extendBounds(null, point),
            lastPoint: point, exclusion, stopped: false,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          onDrawingChange(true)
          onPreviewBoundsChange(tool === 'pen' ? gesture.current.bounds : null)
          redraw(tool === 'pen' ? [...original, gesture.current.stroke] : preview)
        }}
        onPointerMove={event => {
          const current = gesture.current
          if (!current || current.pointerId !== event.pointerId) return
          event.preventDefault()
          if (current.stopped) return
          const captured = event.nativeEvent.getCoalescedEvents?.() ?? []
          for (const item of captured.length ? captured : [event.nativeEvent]) {
            const point = location(item)
            recordPoint(current, point)
            if (current.stopped) break
          }
          if (tool === 'pen') onPreviewBoundsChange(current.bounds)
          redraw(tool === 'pen' ? [...current.original, current.stroke] : current.preview)
        }}
        onPointerUp={event => {
          if (gesture.current?.pointerId !== event.pointerId) return
          if (tool === 'pen') recordPoint(gesture.current, location(event.nativeEvent))
          finish(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={event => { if (gesture.current?.pointerId === event.pointerId) finish(true) }}
        onLostPointerCapture={event => { if (gesture.current?.pointerId === event.pointerId) finish(true) }}
      >
        Draw a mathematical step with a stylus or mouse. Use Check my work to enter or correct its transcription.
      </canvas>
    </div>
  )
}
