import { useEffect, useState } from 'react'
import type { Companion, World } from './StorybookArt'

type Preferences = { companion: Companion; world: World }
const defaults: Preferences = { companion: 'fox', world: 'woodland' }
export function learnerPreferenceScope(parentId: string, profileId: string) {
  return `inkstep:tutor:preferences:${encodeURIComponent(parentId)}:${encodeURIComponent(profileId)}`
}
export function useNotebookPreferences(scope = 'inkstep:lab') {
  const [preferences, setPreferences] = useState<Preferences>(defaults)
  useEffect(() => {
    try {
      const world: World = localStorage.getItem(`${scope}:world:v1`) === 'desk' ? 'desk' : 'woodland'
      const saved = localStorage.getItem(`${scope}:companion:v1`)
      setPreferences({ world, companion: saved === 'owl' || saved === 'fox' ? saved : world === 'desk' ? 'owl' : 'fox' })
    } catch { setPreferences(defaults) }
  }, [scope])
  function selectWorld(world: World) {
    setPreferences(previous => ({ ...previous, world }))
    try { localStorage.setItem(`${scope}:world:v1`, world) } catch { /* Optional device preference. */ }
  }
  function selectCompanion(companion: Companion) {
    setPreferences(previous => ({ ...previous, companion }))
    try { localStorage.setItem(`${scope}:companion:v1`, companion) } catch { /* Optional device preference. */ }
  }
  return { ...preferences, selectWorld, selectCompanion }
}
