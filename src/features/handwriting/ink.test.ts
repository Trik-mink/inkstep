import { describe, expect, it } from 'vitest'
import { eraseAt, isStrokeArray } from './ink'
import type { Point, Stroke } from './types'

const point = (x: number, y: number): Point => ({ x, y, time: 1, pressure: 0.5 })
const line: Stroke = { id: 'long-line', points: [point(100, 100), point(900, 100)] }
const dot: Stroke = { id: 'dot', points: [point(500, 300)] }

describe('whole-stroke erasing', () => {
  it('erases a line near its middle even when no recorded point is nearby', () => {
    expect(eraseAt([line, dot], point(500, 105))).toEqual([dot])
  })
  it('keeps unrelated strokes and handles single-point marks', () => {
    expect(eraseAt([line, dot], point(502, 300))).toEqual([line])
    expect(eraseAt([line, dot], point(30, 30))).toEqual([line, dot])
  })
})

describe('restoring persisted handwriting', () => {
  it('accepts a bounded drawing without changing the original points', () => {
    expect(isStrokeArray([line, dot])).toBe(true)
    expect(line.points).toEqual([point(100, 100), point(900, 100)])
  })
  it('rejects corrupted or oversized coordinates rather than rendering them', () => {
    expect(isStrokeArray([{ id: 'bad', points: [point(Infinity, 0)] }])).toBe(false)
    expect(isStrokeArray([{ id: 'bad', points: [point(-1, 0)] }])).toBe(false)
    expect(isStrokeArray([{ id: 'bad', points: [] }])).toBe(false)
    expect(isStrokeArray({ strokes: [] })).toBe(false)
  })
})
