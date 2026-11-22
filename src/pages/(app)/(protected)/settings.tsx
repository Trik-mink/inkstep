import { Link } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { signOut, useUser } from 'deepspace'
import { CompanionPortrait } from '../../../features/handwriting/StorybookArt'

export default function SettingsPage() {
  const { user } = useUser()
  return <div className="notebook-settings"><div className="notebook-settings-inner">
    <Link to="/learn" className="notebook-settings-back"><ArrowLeft size={14} /> Back to notebooks</Link>
    <header className="notebook-settings-header"><div><p className="tutor-kicker">For parents</p><h1>Notebook settings</h1><p>A little corner for your family’s account.</p></div><div className="settings-companion"><CompanionPortrait companion="owl" decorative /></div></header>
    <section className="notebook-settings-paper" aria-labelledby="account-title"><h2 id="account-title">Your family account</h2><dl><div><dt>Name</dt><dd>{user?.name || 'Parent'}</dd></div><div><dt>Email</dt><dd>{user?.email || 'Loading account…'}</dd></div></dl>
      <button type="button" className="notebook-settings-signout" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
    </section>
    <p className="notebook-settings-note">Learner nicknames and saved progress belong to this account. Switch between notebooks from your family’s library.</p>
  </div></div>
}
