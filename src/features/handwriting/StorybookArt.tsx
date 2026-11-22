import fox from './assets/fox-v2.png'
import owl from './assets/owl-v2.png'

// Keep the existing world preference values compatible with saved devices.
export type World = 'woodland' | 'desk'
export type Companion = 'fox' | 'owl'

export function CompanionPortrait({ companion, decorative = false }: { companion: Companion; decorative?: boolean }) {
  return <img className="companion-portrait" src={companion === 'fox' ? fox : owl}
    alt={decorative ? '' : companion === 'fox' ? 'Your woodland fox companion' : 'Your tawny owl companion'} draggable={false} />
}
