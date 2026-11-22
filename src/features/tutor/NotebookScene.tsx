import { CompanionPortrait } from '../handwriting/StorybookArt'

/** Shared entry illustration, made from the notebook's existing paper and companion assets. */
export function NotebookScene({ compact = false }: { compact?: boolean }) {
  return <div className={`notebook-scene ${compact ? 'is-compact' : ''}`} aria-hidden="true">
    <span className="scene-orbit orbit-one" /><span className="scene-orbit orbit-two" />
    <span className="scene-sprig sprig-left">❧</span><span className="scene-sprig sprig-right">❧</span>
    <div className="scene-book">
      <div className="scene-page scene-page-left"><span className="scene-chapter">A new chapter</span><p><span className="scene-full-copy">Every big idea<br />starts with a<br /><em>little scribble.</em></span><span className="scene-short-copy">Little ideas.<br /><em>Big adventures.</em></span></p><span className="scene-doodle">✧</span><span className="scene-folio">01</span></div>
      <div className="scene-page scene-page-right"><span className="scene-ribbon" /><span className="scene-question">Let’s find out.</span><span className="scene-equation">x + 7 = 19</span><span className="scene-ink-line" /><span className="scene-folio">02</span></div>
    </div>
    <div className="scene-fox"><CompanionPortrait companion="fox" decorative /></div>
    <div className="scene-owl"><CompanionPortrait companion="owl" decorative /></div>
    <span className="scene-pencil" />
  </div>
}
