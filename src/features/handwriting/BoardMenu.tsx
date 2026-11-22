import type { ReactNode, RefObject } from 'react'
import { X } from 'lucide-react'
import type { CaptureMode, RecognitionResult, Sample, Scenario } from './types'
import { CompanionPortrait, type Companion, type World } from './StorybookArt'

type Props = {
  tutorMode?: boolean
  menuRef: RefObject<HTMLDivElement | null>
  world: World
  companion: Companion
  onCompanionChange: (companion: Companion) => void
  review: RecognitionResult | null
  error: string
  onWorldChange: (world: World) => void
  mode: CaptureMode
  scenario: Scenario
  drawing: boolean
  stylusOnly: boolean
  onStylusOnlyChange: (value: boolean) => void
  onModeChange: (mode: CaptureMode) => void
  onScenarioChange: (scenario: Scenario) => void
  samples: Sample[]
  onExport: () => void
  exportDisabled: boolean
  children: ReactNode
}

export function BoardMenu({ tutorMode = false, menuRef, world, onWorldChange, companion, onCompanionChange, review, error, mode, scenario, drawing, stylusOnly, onStylusOnlyChange, onModeChange, onScenarioChange, samples, onExport, exportDisabled, children }: Props) {
  return <div ref={menuRef} id="board-menu" className="board-menu" popover="auto" aria-labelledby="menu-title" onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation() }}>
    <div className="menu-heading"><h2 id="menu-title">Your notebook</h2><button className="icon-button" aria-label="Close board menu" popoverTarget="board-menu" popoverTargetAction="hide"><X size={20} /></button></div>
    <h3>Companion</h3>
    <div className="companion-choices" role="group" aria-label="Choose your companion">
      {(['fox', 'owl'] as const).map(option => <button key={option} className="companion-choice" aria-label={`Choose ${option}`} aria-pressed={companion === option} disabled={drawing} onClick={() => onCompanionChange(option)}><CompanionPortrait companion={option} decorative /><span>{option === 'fox' ? 'Fox' : 'Owl'}</span></button>)}
    </div>
    <h3 className="stationery-heading">Stationery</h3>
    <div className="world-choices" role="group" aria-label="Choose your stationery">
      <button className="world-choice woodland-choice" aria-label="Enchanted woodland classroom" aria-pressed={world === 'woodland'} disabled={drawing} onClick={() => onWorldChange('woodland')}>Sage</button>
      <button className="world-choice desk-choice" aria-label="Magical storybook desk" aria-pressed={world === 'desk'} disabled={drawing} onClick={() => onWorldChange('desk')}>Plum</button>
    </div>
    <label className="stylus-option"><input type="checkbox" checked={stylusOnly} disabled={drawing} onChange={event => onStylusOnlyChange(event.target.checked)} />Ignore finger touches</label>
    <section className="diagnostics" aria-label="Device diagnostics">{children}
      {error && <p className="diagnostic-error">{error}</p>}
      {review && <details className="snapshot-details"><summary>View submitted handwriting</summary><img className="submission-preview" src={review.submission.image} alt="The exact handwriting snapshot submitted for this review" /><p>Submission {review.submission.id} · revision {review.submission.revision} · source: {review.source}</p></details>}
    </section>
    <section className="experiment-settings" aria-labelledby="experiment-title">
      <h3 id="experiment-title">{tutorMode ? 'Read my writing' : 'Experiment settings'}</h3>
      <p>{tutorMode ? 'AI reads your writing only when you check it. Always confirm the symbols. You can type instead. Up to 30 AI reads per parent per day; failed reads use a slot too.' : 'Live recognition is not connected. The companions are decorative; no live tutoring or grading is provided.'}</p>
      <label htmlFor="capture-mode">Capture method</label><select id="capture-mode" value={mode} disabled={drawing} onChange={event => onModeChange(event.target.value as CaptureMode)}>{tutorMode && <option value="live">AI handwriting</option>}<option value="manual">{tutorMode ? 'Type my step' : 'Manual capture'}</option>{!tutorMode && <option value="simulation">Sample responses (simulated)</option>}</select>
      {mode === 'simulation' && <><label htmlFor="scenario">Sample response</label><select id="scenario" value={scenario} disabled={drawing} onChange={event => onScenarioChange(event.target.value as Scenario)}><option value="example">Example transcription</option><option value="misread">Misread a symbol</option><option value="failure">Recognition error</option><option value="slow">Slow response</option></select></>}
      <p>{mode === 'live' ? 'A real AI read. Confirm or correct its transcription before math checking.' : mode === 'manual' ? 'Enter the transcription yourself. No AI is reading the board.' : 'A fixed response is shown regardless of your writing.'}</p>
    </section>
    {!tutorMode && <section className="sample-summary" aria-labelledby="samples-title"><h3 id="samples-title">{samples.length} {samples.length === 1 ? 'sample' : 'samples'} saved</h3><p>Device-local. Manual and simulated samples are excluded from recognition accuracy.</p><button className="secondary-button" disabled={exportDisabled} onClick={onExport}>Export collection</button></section>}
  </div>
}
