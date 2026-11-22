import { BOARD_HEIGHT, BOARD_WIDTH, type Point, type Stroke } from './types'

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
  ))
  return Math.hypot(point.x - start.x - ratio * dx, point.y - start.y - ratio * dy)
}

export function eraseAt(strokes: Stroke[], point: Point, radius = 16): Stroke[] {
  return strokes.filter(stroke => {
    if (stroke.points.length === 1) return Math.hypot(stroke.points[0].x - point.x, stroke.points[0].y - point.y) > radius
    return !stroke.points.some((end, index) => index > 0 && distanceToSegment(point, stroke.points[index - 1], end) <= radius)
  })
}

export function paintInk(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.strokeStyle = '#173e3a'
  ctx.fillStyle = '#173e3a'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    if (!stroke.points.length) continue
    const first = stroke.points[0]
    if (stroke.points.length === 1) {
      ctx.beginPath()
      ctx.arc(first.x, first.y, 1.75, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }
}

export function imageOf(strokes: Stroke[], viewport?: { width: number; height: number }): string {
  const canvas = document.createElement('canvas')
  canvas.width = BOARD_WIDTH
  canvas.height = viewport && viewport.width > 0 && viewport.height > 0
    ? Math.max(1, Math.round(BOARD_WIDTH * viewport.height / viewport.width))
    : BOARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser could not create the handwriting image. Your writing is still on the board.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(canvas.width / BOARD_WIDTH, 0, 0, canvas.height / BOARD_HEIGHT, 0, 0)
  paintInk(ctx, strokes)
  return canvas.toDataURL('image/png')
}

export function isStrokeArray(value: unknown): value is Stroke[] {
  if (!Array.isArray(value) || value.length > 1000) return false
  let points = 0
  return value.every(stroke => {
    if (!stroke || typeof stroke.id !== 'string' || stroke.id.length > 100 || !Array.isArray(stroke.points)) return false
    points += stroke.points.length
    return points <= 100_000 && stroke.points.length > 0 && stroke.points.every((p: Point) =>
      p && Number.isFinite(p.x) && p.x >= 0 && p.x <= BOARD_WIDTH &&
      Number.isFinite(p.y) && p.y >= 0 && p.y <= BOARD_HEIGHT &&
      Number.isFinite(p.pressure) && p.pressure >= 0 && p.pressure <= 1 &&
      Number.isFinite(p.time) && p.time >= 0,
    )
  })
}
