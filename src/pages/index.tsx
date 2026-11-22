import { ArrowRight, ChevronDown, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { seo } from '../seo'
import { NotebookScene } from '../features/tutor/NotebookScene'
import '../features/tutor/entry.css'

export default function Landing() {
  return <><Seo {...seo} path="/" /><main className="inkstep-entry" data-testid="static-landing">
    <header className="entry-header"><Link className="entry-brand" to="/" aria-label="Inkstep home">inkstep<span>.</span></Link><button type="button" className="entry-parent-button" popoverTarget="parent-info">For parents <ChevronDown size={14} /></button></header>
    <section className="entry-stage" aria-labelledby="welcome-title">
      <h1 id="welcome-title">Ready for a little discovery?</h1>
      <p className="entry-intro">A notebook, a woodland friend, and room to figure things out.</p>
      <NotebookScene />
      <Link className="entry-open" to="/learn">Open my notebook <ArrowRight size={18} /></Link>
      <p className="entry-note">For curious minds in grades 3–4</p>
    </section>
    <footer className="entry-footer"><span aria-hidden="true">✧</span><span>Small steps. Your own discoveries.</span></footer>
    <aside className="entry-parent-info" id="parent-info" popover="auto" aria-labelledby="parent-info-title">
      <button type="button" className="parent-info-close" popoverTarget="parent-info" popoverTargetAction="hide" aria-label="Close parent information"><X size={18} /></button>
      <h2 id="parent-info-title">A notebook for your family.</h2>
      <p>Sign in once, then create a nickname for each learner. Children don’t need email accounts.</p>
      <p>Eight little math adventures explore missing numbers. AI reads a written step when requested; the learner checks its symbols before the math is evaluated.</p>
      <Link to="/learn">Parent sign-in →</Link>
    </aside>
  </main></>
}
