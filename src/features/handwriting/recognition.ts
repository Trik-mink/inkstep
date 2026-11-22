import type { RecognitionResult, Submission } from './types'

/** Interaction fixtures only. This adapter never reads ink or calls a provider. */
export async function recognize(submission: Submission, signal: AbortSignal): Promise<RecognitionResult> {
  const started = performance.now()
  if (submission.mode === 'manual') {
    return { submission, candidate: '', elapsedMs: 0, source: 'manual' }
  }
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Cancelled', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, submission.scenario === 'slow' ? 3000 : 650)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
  if (submission.scenario === 'failure') throw new Error('Simulated recognition failure. Your writing is safe. Try again or switch to manual capture.')
  return {
    submission,
    candidate: submission.scenario === 'misread' ? 'x + 1 = 19' : 'x + 7 = 19',
    elapsedMs: Math.round(performance.now() - started),
    source: 'simulation',
  }
}
