import { describe, expect, it } from 'vitest'
import { chooseCompanionCorner, companionRect, findFeedbackPosition, intersects, strokeRectangles } from './notebookLayout'
import type { Stroke } from './types'

const canvas = { x: 28, y: 88, width: 968, height: 652 }
const problem = { x: 60, y: 108, width: 250, height: 82 }
const stroke: Stroke = { id: 'original', points: [{ x: 950, y: 530, pressure: 0.7, time: 1 }] }

describe('companion reservations', () => {
  it('moves away from existing ink without changing saved coordinates', () => {
    const ink = strokeRectangles([stroke], canvas)
    const corner = chooseCompanionCorner(canvas, [...ink, problem])
    expect(corner).toBe('bottom-left')
    expect(intersects(companionRect(canvas, corner!)!, ink[0])).toBe(false)
    expect(stroke.points[0]).toEqual({ x: 950, y: 530, pressure: 0.7, time: 1 })
  })
  it('uses a toolbar companion when every corner contains handwriting', () => {
    expect(chooseCompanionCorner(canvas, [canvas])).toBe(null)
  })
})

describe('temporary feedback placement', () => {
  const size = { width: 400, height: 116 }
  const ink = [{ x: 104, y: 226, width: 280, height: 126 }]
  it('places feedback beside the submission without covering ink, prompt, or companion', () => {
    const blocked = [...ink, problem, companionRect(canvas, 'bottom-right')!]
    const position = findFeedbackPosition(canvas, size, ink, blocked)
    expect(position).not.toBe(null)
    expect(position!.x).toBeGreaterThan(ink[0].x + ink[0].width)
    expect(blocked.some(rect => intersects(position!, rect))).toBe(false)
  })
  it('repositions below the ink in portrait rather than squeezing over it', () => {
    const portrait = { x: 28, y: 88, width: 712, height: 908 }
    const position = findFeedbackPosition(portrait, size, ink, [...ink, problem, companionRect(portrait, 'bottom-right')!])
    expect(position).not.toBe(null)
    expect(position!.y).toBeGreaterThan(ink[0].y + ink[0].height)
  })
  it('requests a separate submitted-writing sheet when no gap exists', () => {
    expect(findFeedbackPosition(canvas, size, [canvas], [canvas])).toBe(null)
  })
})
