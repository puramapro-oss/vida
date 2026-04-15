/**
 * V6 §10 — Social feed (events, no amounts).
 * Ex: "Léa a atteint palier Or", "Karim a activé Mode Titan".
 */
export type SocialEvent = {
  id: string
  first_name: string
  type: 'tier' | 'engagement' | 'withdrawal' | 'nature_score' | 'streak'
  label: string
  created_at: string
}

export default function SocialFeed({ events }: { events: SocialEvent[] }) {
  if (!events.length) return null

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-3">
        En direct
      </h3>
      <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.map(ev => (
          <li key={ev.id} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 text-lg">
              {ev.type === 'tier' ? '🏆'
                : ev.type === 'engagement' ? '⚡'
                : ev.type === 'withdrawal' ? '💫'
                : ev.type === 'nature_score' ? '🌿'
                : '🔥'}
            </span>
            <div>
              <div className="text-white/90">
                <strong>{ev.first_name}</strong> {ev.label}
              </div>
              <div className="text-[10px] text-white/40">
                {new Date(ev.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
