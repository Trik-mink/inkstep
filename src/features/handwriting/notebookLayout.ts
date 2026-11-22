import { BOARD_HEIGHT, BOARD_WIDTH, type Point, type Stroke } from './types'

export type Rect = { x: number; y: number; width: number; height: number }
export type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
export const RESERVE_WIDTH = 216
export const RESERVE_HEIGHT = 104

export function intersects(a: Rect, b: Rect, gap = 0): boolean {
  return a.x < b.x + b.width + gap && a.x + a.width > b.x - gap &&
    a.y < b.y + b.height + gap && a.y + a.height > b.y - gap
}

export function extendBounds(bounds: Rect | null, point: Pick<Point, 'x' | 'y'>): Rect {
  if (!bounds) return { x: point.x, y: point.y, width: 0, height: 0 }
  const x = Math.min(bounds.x, point.x), y = Math.min(bounds.y, point.y)
  return { x, y, width: Math.max(bounds.x + bounds.width, point.x) - x, height: Math.max(bounds.y + bounds.height, point.y) - y }
}

export function boundsOnCanvas(bounds: Rect, canvas: Rect): Rect {
  // Include the painted stroke width, including single-point marks and large viewports.
  const margin = Math.max(4, canvas.width / BOARD_WIDTH * 2, canvas.height / BOARD_HEIGHT * 2)
  return { x: canvas.x + bounds.x / BOARD_WIDTH * canvas.width - margin, y: canvas.y + bounds.y / BOARD_HEIGHT * canvas.height - margin,
    width: bounds.width / BOARD_WIDTH * canvas.width + margin * 2, height: bounds.height / BOARD_HEIGHT * canvas.height + margin * 2 }
}

export function strokeRectangles(strokes: Stroke[], canvas: Rect): Rect[] {
  return strokes.flatMap(stroke => {
    const bounds = stroke.points.reduce<Rect | null>(extendBounds, null)
    return bounds ? [boundsOnCanvas(bounds, canvas)] : []
  })
}

export function companionRect(canvas: Rect, corner: Corner): Rect {
  return { x: corner.endsWith('right') ? canvas.x + canvas.width - RESERVE_WIDTH : canvas.x,
    y: corner.startsWith('bottom') ? canvas.y + canvas.height - RESERVE_HEIGHT : canvas.y,
    width: RESERVE_WIDTH, height: RESERVE_HEIGHT }
}

export function chooseCompanionCorner(canvas: Rect, occupied: Rect[]): Corner | null {
  if (canvas.width < RESERVE_WIDTH || canvas.height < RESERVE_HEIGHT) return null
  const corners: Corner[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
  return corners.find(corner => !occupied.some(ink => intersects(companionRect(canvas, corner), ink, 8))) ?? null
}

function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map(r => r.x)), y = Math.min(...rects.map(r => r.y))
  return { x, y, width: Math.max(...rects.map(r => r.x + r.width)) - x, height: Math.max(...rects.map(r => r.y + r.height)) - y }
}

export function findFeedbackPosition(canvas: Rect, size: Pick<Rect, 'width' | 'height'>, submission: Rect[], occupied: Rect[]): Rect | null {
  if (canvas.width < size.width + 8 || canvas.height < size.height + 8) return null
  const anchor = submission.length ? union(submission) : { x: canvas.x + 36, y: canvas.y + 120, width: 0, height: 0 }
  const candidates = [
    { x: anchor.x + anchor.width + 18, y: anchor.y - 5 },
    { x: anchor.x, y: anchor.y + anchor.height + 18 },
    { x: anchor.x - size.width - 18, y: anchor.y - 5 },
    { x: anchor.x, y: anchor.y - size.height - 18 },
    ...[0, .5, 1].flatMap(y => [0, .5, 1].map(x => ({ x: canvas.x + 4 + (canvas.width - size.width - 8) * x,
      y: canvas.y + 4 + (canvas.height - size.height - 8) * y }))),
  ]
  return candidates.map(p => ({ x: Math.max(canvas.x + 4, Math.min(p.x, canvas.x + canvas.width - size.width - 4)),
    y: Math.max(canvas.y + 4, Math.min(p.y, canvas.y + canvas.height - size.height - 4)), ...size }))
    .find(candidate => !occupied.some(rect => intersects(candidate, rect, 12))) ?? null
}
