import { useState } from 'react'
import type { Companion, World } from './StorybookArt'

type Preferences = { companion: Companion; world: World }
const defaults: Preferences = { companion: 'fox', world: 'woodland' }
export function learnerPreferenceScope(parentId: string, profileId: string) {
  return `inkstep:tutor:preferences:${encodeURIComponent(parentId)}:${encodeURIComponent(profileId)}`
}
function readPreferences(scope: string): Preferences {
  try {
    const world: World = localStorage.getItem(`${scope}:world:v1`) === 'desk' ? 'desk' : 'woodland'
    const saved = localStorage.getItem(`${scope}:companion:v1`)
    return { world, companion: saved === 'owl' || saved === 'fox' ? saved : world === 'desk' ? 'owl' : 'fox' }
  } catch { return defaults }
}
export function useNotebookPreferences(scope = 'inkstep:lab') {
  const [preferences, setPreferences] = useState(() => readPreferences(scope))
  const [loadedScope, setLoadedScope] = useState(scope)
  if (loadedScope !== scope) {
    setLoadedScope(scope)
    setPreferences(readPreferences(scope))
  }
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
