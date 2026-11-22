import { describe, expect, it } from 'vitest'
import { checkStep, PROBLEMS, hintFor } from './math'

describe('one-step math checker', () => {
  it('accepts solved answers, reverse equations, and correct equivalent steps', () => {
    const p = PROBLEMS[0]
    expect(checkStep(p, 'x = 12').kind).toBe('solved')
    expect(checkStep(p, '12 = x').kind).toBe('solved')
    expect(checkStep(p, '12').kind).toBe('solved')
    expect(checkStep(p, 'x = 19 - 7').kind).toBe('equivalent')
    expect(checkStep(p, 'x + 7 - 7 = 19 - 7').kind).toBe('equivalent')
    expect(checkStep(p, 'x + 7 = 19').kind).toBe('unchanged')
  })
  it('checks each supported operation and normalizes handwritten operator symbols', () => {
    for (const p of PROBLEMS) expect(checkStep(p, `x = ${p.answer}`).kind).toBe('solved')
    expect(checkStep(PROBLEMS[2], '3 × x = 21').kind).toBe('unchanged')
    expect(checkStep(PROBLEMS[3], 'x ÷ 4 = 6').kind).toBe('unchanged')
  })
  it('rejects incorrect equations without praising a coincidental true equality', () => {
    expect(checkStep(PROBLEMS[0], 'x = 26').kind).toBe('incorrect')
    expect(checkStep(PROBLEMS[0], '(x-13)/999/999/99=0').kind).toBe('incorrect')
    expect(checkStep(PROBLEMS[0], 'x + 7 = 20').kind).toBe('incorrect')
    expect(checkStep(PROBLEMS[0], '12 = 12').kind).toBe('unsupported')
    expect(checkStep(PROBLEMS[0], 'x = x').kind).toBe('unsupported')
  })
  it('does not execute arbitrary text or accept nonlinear and undefined expressions', () => {
    for (const input of ['alert(1)', 'x*x=144', '12/x=1', 'x=1/0', 'x=12=12', '', 'x=1.2', 'x=999999999999999999']) {
      expect(checkStep(PROBLEMS[0], input).kind).toBe('unsupported')
    }
  })
  it('provides progressive hints without revealing the final answer', () => {
    expect(hintFor(PROBLEMS[0], 1)).toContain('undo')
    expect(hintFor(PROBLEMS[0], 2)).toContain('19')
    expect(hintFor(PROBLEMS[0], 2)).not.toContain('12')
  })
})
