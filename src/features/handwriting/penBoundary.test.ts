import { expect, it } from 'vitest'
import { clipBeforeRect } from './penBoundary'
import type { Point } from './types'
const point = (x: number, y: number): Point => ({ x, y, pressure: .5, time: 10 })
const corner = { x: 800, y: 450, width: 200, height: 110 }
it('ends a pen segment just before entering the companion reserve', () => {
  const clipped = clipBeforeRect(point(700, 400), point(950, 530), corner)!
  expect(clipped.x).toBeLessThan(800)
  expect(clipped.x).toBeCloseTo(800, 2)
  expect(clipped.y).toBeCloseTo(452, 2)
})
it('detects a fast segment crossing the reserve even if its endpoint is outside', () => {
  expect(clipBeforeRect(point(700, 500), point(1100, 500), corner)!.x).toBeCloseTo(800, 2)
})
it('keeps unrelated pen segments unchanged and tolerates horizontal or vertical movement', () => {
  expect(clipBeforeRect(point(200, 300), point(700, 300), corner)).toBe(null)
  expect(clipBeforeRect(point(900, 300), point(900, 500), corner)!.y).toBeCloseTo(450, 2)
  expect(clipBeforeRect(point(700, 600), point(1100, 600), corner)).toBe(null)
})
