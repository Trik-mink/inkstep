import type { Rect } from './notebookLayout'
import type { Point } from './types'

export function insideRect(point: Pick<Point, 'x' | 'y'>, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height
}

// Clip the entire segment, including fast/coalesced moves whose endpoints skip over the reserve.
export function clipBeforeRect(start: Point, end: Point, rect: Rect): Point | null {
  let enter = 0, leave = 1
  for (const [origin, delta, min, max] of [
    [start.x, end.x - start.x, rect.x, rect.x + rect.width],
    [start.y, end.y - start.y, rect.y, rect.y + rect.height],
  ]) {
    if (delta === 0) { if (origin < min || origin > max) return null; continue }
    const a = (min - origin) / delta, b = (max - origin) / delta
    enter = Math.max(enter, Math.min(a, b))
    leave = Math.min(leave, Math.max(a, b))
    if (enter > leave) return null
  }
  const t = Math.max(0, enter - .000001)
  return { ...end, x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t }
}
