/**
 * Gated routes. Any file under src/pages/(app)/(protected)/ requires sign-in.
 * The `(protected)` folder is a Generouted route group — parentheses mean
 * it doesn't appear in the URL. For a dynamic page that does NOT require
 * sign-in, put it directly under src/pages/(app)/; for a static page, put it
 * at the top level of src/pages/.
 *
 * Children may call data hooks like `useUser()` safely because the parent
 * (app)/_layout.tsx mounts <RecordProvider> above this layout.
 *
 * The `fallback` keeps signed-out visitors inside the app's own chrome
 * (without it, AuthGate shows the SDK's full-screen, non-dismissible
 * overlay). The sign-in overlay opens on demand and can be dismissed.
 */

import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { AuthGate, AuthOverlay } from 'deepspace'
import { ArrowRight } from 'lucide-react'
import { NotebookScene } from '../../../features/tutor/NotebookScene'
import '../../../features/tutor/entry.css'

export default function ProtectedLayout() {
  return (
    <AuthGate fallback={<SignedOutPanel />}>
      <Outlet />
    </AuthGate>
  )
}

function SignedOutPanel() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="entry-gate">
      <NotebookScene compact />
      <h1>A notebook for your family.</h1>
      <p>A parent signs in first. Then each little explorer gets a notebook of their own.</p>
      <button type="button" className="entry-open" onClick={() => setShowAuthModal(true)}>Parent sign-in <ArrowRight size={18} /></button>
      <Link to="/" className="entry-back">Back to the woodland</Link>
      {showAuthModal && <AuthOverlay title="Parents, come on in." description="Sign in to open your family’s notebooks." onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
