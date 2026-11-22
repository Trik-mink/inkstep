export type Operation = 'add' | 'subtract' | 'multiply' | 'divide'
export type Problem = { id: string; expression: string; answer: number; amount: number; total: number; operation: Operation }
export const PROBLEMS: Problem[] = [
  { id: 'add-7', expression: 'x + 7 = 19', answer: 12, amount: 7, total: 19, operation: 'add' },
  { id: 'subtract-8', expression: 'x - 8 = 15', answer: 23, amount: 8, total: 15, operation: 'subtract' },
  { id: 'multiply-3', expression: '3 × x = 21', answer: 7, amount: 3, total: 21, operation: 'multiply' },
  { id: 'divide-4', expression: 'x ÷ 4 = 6', answer: 24, amount: 4, total: 6, operation: 'divide' },
  { id: 'add-16', expression: 'x + 16 = 42', answer: 26, amount: 16, total: 42, operation: 'add' },
  { id: 'subtract-12', expression: 'x - 12 = 18', answer: 30, amount: 12, total: 18, operation: 'subtract' },
  { id: 'multiply-8', expression: '8 × x = 48', answer: 6, amount: 8, total: 48, operation: 'multiply' },
  { id: 'divide-6', expression: 'x ÷ 6 = 7', answer: 42, amount: 6, total: 7, operation: 'divide' },
]
export type StepKind = 'solved' | 'equivalent' | 'unchanged' | 'incorrect' | 'unsupported'
export type StepResult = { kind: StepKind; message: string; normalized: string }
export function normalizeStep(value: string): string {
  return value.trim().toLowerCase().replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/\s/g, '').replace(/(\d)x/g, '$1*x')
}
type Linear = { a: number; b: number }
function expression(source: string): Linear {
  const tokens = source.match(/\d+|x|[+*/()-]/g) ?? []
  if (tokens.join('') !== source || !tokens.length || tokens.length > 100) throw new Error('Unsupported expression')
  let index = 0
  const checked = (v: Linear) => {
    if (![v.a, v.b].every(n => Number.isFinite(n) && Math.abs(n) <= 1e9)) throw new Error('Out of range')
    return v
  }
  function atom(): Linear {
    const t = tokens[index++]
    if (t === '+' || t === '-') { const v = atom(); return { a: t === '-' ? -v.a : v.a, b: t === '-' ? -v.b : v.b } }
    if (t === '(') { const v = sum(); if (tokens[index++] !== ')') throw new Error('Missing bracket'); return v }
    if (t === 'x') return { a: 1, b: 0 }
    if (t && /^\d{1,3}$/.test(t)) return { a: 0, b: Number(t) }
    throw new Error('Unsupported symbol')
  }
  function product(): Linear {
    let left = atom()
    while (tokens[index] === '*' || tokens[index] === '/') {
      const op = tokens[index++], right = atom()
      if (op === '*') {
        if (left.a && right.a) throw new Error('Nonlinear expression')
        left = checked({ a: left.a * right.b + right.a * left.b, b: left.b * right.b })
      } else {
        if (right.a || !right.b) throw new Error('Unsupported divisor')
        left = checked({ a: left.a / right.b, b: left.b / right.b })
      }
    }
    return left
  }
  function sum(): Linear {
    let left = product()
    while (tokens[index] === '+' || tokens[index] === '-') {
      const sign = tokens[index++] === '+' ? 1 : -1, right = product()
      left = checked({ a: left.a + sign * right.a, b: left.b + sign * right.b })
    }
    return left
  }
  const result = sum()
  if (index !== tokens.length) throw new Error('Extra symbols')
  return result
}
export function checkStep(problem: Problem, input: string): StepResult {
  let normalized = normalizeStep(input)
  const result = (kind: StepKind, message: string): StepResult => ({ kind, message, normalized })
  if (normalized.length > 200 || !normalized) return result('unsupported', 'Write one equation using x, or type your answer as x = a number.')
  if (/^\d{1,3}$/.test(normalized)) normalized = `x=${normalized}`
  const sides = normalized.split('=')
  try {
    if (sides.length !== 2) throw new Error('One equation only')
    const left = expression(sides[0]), right = expression(sides[1])
    const a = left.a - right.a, b = left.b - right.b
    if (Math.abs(a) < 1e-10) throw new Error('Equation does not determine x')
    if (Math.abs(-b / a - problem.answer) > 1e-8) return result('incorrect', 'That step changes the value of x. Try using the opposite operation on both sides.')
    if (normalized === normalizeStep(problem.expression)) return result('unchanged', 'You copied the problem correctly. Try a step that gets x by itself.')
    if (/^x=\d{1,3}$/.test(normalized) || /^\d{1,3}=x$/.test(normalized)) return result('solved', 'You found x! Your answer makes the original equation true.')
    return result('equivalent', 'That is a valid step. Now simplify until you have x = one number.')
  } catch {
    return result('unsupported', 'I could not check that format. Confirm the symbols, then use one equation such as x = 19 - 7. This does not count as a wrong attempt.')
  }
}
export function hintFor(p: Problem, level: number): string {
  if (p.operation === 'add') return level < 2 ? `What operation would undo adding ${p.amount}?` : `Subtract ${p.amount} from both sides. What is ${p.total} minus ${p.amount}?`
  if (p.operation === 'subtract') return level < 2 ? `What operation would undo subtracting ${p.amount}?` : `Add ${p.amount} to both sides. What is ${p.total} plus ${p.amount}?`
  if (p.operation === 'multiply') return level < 2 ? `What operation would undo multiplying by ${p.amount}?` : `Divide both sides by ${p.amount}. How many groups of ${p.amount} fit into ${p.total}?`
  return level < 2 ? `What operation would undo dividing by ${p.amount}?` : `Multiply both sides by ${p.amount}. What is ${p.total} times ${p.amount}?`
}
