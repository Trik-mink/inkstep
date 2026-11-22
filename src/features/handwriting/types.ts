export const BOARD_WIDTH = 1000
export const BOARD_HEIGHT = 560
export const PROBLEM = 'x + 7 = 19'

export type Point = { x: number; y: number; pressure: number; time: number }
export type Stroke = { id: string; points: Point[] }
export type Tool = 'pen' | 'eraser'
export type CaptureMode = 'manual' | 'simulation' | 'live'
export type Scenario = 'example' | 'misread' | 'failure' | 'slow'

export type Submission = {
  id: string
  revision: number
  problem: string
  strokes: Stroke[]
  image: string
  mode: CaptureMode
  scenario: Scenario
  createdAt: string
}

export type RecognitionResult = {
  submission: Submission
  candidate: string
  elapsedMs: number
  source: 'manual' | 'simulation' | 'live'
}

export type Sample = RecognitionResult & {
  confirmedExpression: string
  confirmedAt: string
  corrected: boolean
  eligibleForAccuracy: false
}

export type Draft = { version: 1; revision: number; strokes: Stroke[] }

export type TutorNotebookConfig = {
  problem: string
  storageKey: string
  header: import('react').ReactNode
  overlay: import('react').ReactNode
  recognize: (submission: Submission, signal: AbortSignal) => Promise<RecognitionResult>
  onConfirm: (sample: Sample) => Promise<void>
}
