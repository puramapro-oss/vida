/**
 * V6 §10 — Purama Score 0-1000.
 * Nature 30% | Streak 20% | Filleuls 20% | Marketplace 15% | Missions 15%.
 */
export type PuramaScoreBreakdown = {
  nature: number
  streak: number
  filleuls: number
  marketplace: number
  missions: number
}

export function computePuramaScore(b: PuramaScoreBreakdown): number {
  return Math.round(
    b.nature * 0.3 + b.streak * 0.2 + b.filleuls * 0.2 + b.marketplace * 0.15 + b.missions * 0.15
  )
}

export default function PuramaScore({ score, breakdown }: { score: number; breakdown?: PuramaScoreBreakdown }) {
  const pct = Math.min(100, Math.max(0, (score / 1000) * 100))
  const tier =
    score >= 900 ? { label: 'Éternel', color: 'from-amber-400 to-yellow-500' }
    : score >= 700 ? { label: 'Légende', color: 'from-purple-400 to-pink-500' }
    : score >= 500 ? { label: 'Diamant', color: 'from-cyan-400 to-blue-500' }
    : score >= 300 ? { label: 'Or', color: 'from-yellow-400 to-amber-500' }
    : score >= 100 ? { label: 'Argent', color: 'from-slate-300 to-slate-500' }
    : { label: 'Bronze', color: 'from-orange-400 to-orange-600' }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm uppercase tracking-wider text-white/70">Purama Score</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-black font-semibold`}>
          {tier.label}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-sm text-white/50 pb-1">/ 1000</span>
      </div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${tier.color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {breakdown && (
        <ul className="grid grid-cols-5 gap-1 text-[10px] text-white/50 pt-1">
          <li className="text-center">Nature<br /><strong className="text-white/80">{breakdown.nature}</strong></li>
          <li className="text-center">Streak<br /><strong className="text-white/80">{breakdown.streak}</strong></li>
          <li className="text-center">Filleuls<br /><strong className="text-white/80">{breakdown.filleuls}</strong></li>
          <li className="text-center">Market<br /><strong className="text-white/80">{breakdown.marketplace}</strong></li>
          <li className="text-center">Missions<br /><strong className="text-white/80">{breakdown.missions}</strong></li>
        </ul>
      )}
    </div>
  )
}
