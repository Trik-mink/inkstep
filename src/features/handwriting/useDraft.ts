import { useEffect, useState } from 'react'
import { isStrokeArray } from './ink'
import type { Draft, Sample, Stroke } from './types'

export const DRAFT_KEY = 'inkstep:lab:draft:v1'
export const SAMPLES_KEY = 'inkstep:lab:samples:v1'
const empty: Draft = { version: 1, revision: 0, strokes: [] }

function isSample(value: unknown): value is Sample {
  if (!value || typeof value !== 'object') return false
  const sample = value as Sample
  return typeof sample.confirmedExpression === 'string' && sample.confirmedExpression.length <= 200 &&
    typeof sample.confirmedAt === 'string' && typeof sample.candidate === 'string' &&
    (sample.source === 'manual' || sample.source === 'simulation' || sample.source === 'live') &&
    sample.eligibleForAccuracy === false && Number.isFinite(sample.elapsedMs) &&
    typeof sample.submission?.id === 'string' && Number.isSafeInteger(sample.submission.revision) &&
    isStrokeArray(sample.submission.strokes) && typeof sample.submission.image === 'string' &&
    /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(sample.submission.image) && sample.submission.image.length < 2_000_000
}

export function useDraft(storageKey = 'inkstep:lab') {
  const draftKey = `${storageKey}:draft:v1`
  const samplesKey = `${storageKey}:samples:v1`
  const [draft, setDraft] = useState<Draft>(empty)
  const [ready, setReady] = useState(false)
  const [storageEnabled, setStorageEnabled] = useState(true)
  const [storageError, setStorageError] = useState('')
  const [samples, setSamples] = useState<Sample[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const saved = JSON.parse(raw) as Draft
        if (saved.version !== 1 || !Number.isSafeInteger(saved.revision) || saved.revision < 0 || !isStrokeArray(saved.strokes)) throw new Error('Invalid draft')
        setDraft(saved)
      }
      const storedSamples = localStorage.getItem(samplesKey)
      if (storedSamples) {
        const saved: unknown = JSON.parse(storedSamples)
        if (!Array.isArray(saved) || saved.length > 40 || !saved.every(isSample)) throw new Error('Invalid samples')
        setSamples(saved)
      }
    } catch {
      setStorageEnabled(false)
      setStorageError('Saved work could not be restored. Existing storage was left unchanged. You can still write and export this session.')
    }
    setReady(true)
  }, [draftKey, samplesKey])

  useEffect(() => {
    if (!ready || !storageEnabled) return
    try { localStorage.setItem(draftKey, JSON.stringify(draft)) }
    catch {
      setStorageEnabled(false)
      setStorageError('This device could not save your latest writing. Keep this page open and export before leaving.')
    }
  }, [draft, ready, storageEnabled, draftKey])

  function change(strokes: Stroke[]) {
    setDraft(previous => ({ ...previous, strokes, revision: previous.revision + 1 }))
  }

  function saveSample(sample: Sample): boolean {
    if (samples.length >= 40 || samples.some(saved => saved.submission.id === sample.submission.id)) return false
    const next = [...samples, sample]
    if (storageEnabled) {
      try { localStorage.setItem(samplesKey, JSON.stringify(next)) }
      catch {
        setStorageEnabled(false)
        setStorageError('Device storage is full. Samples are kept for this session only. Export them before leaving.')
      }
    }
    setSamples(next)
    return true
  }

  return { draft, ready, storageError, storageEnabled, change, samples, saveSample }
}
