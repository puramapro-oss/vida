/**
 * V6 §10 — Flywheel visible.
 * "Plus on est nombreux, plus chacun gagne".
 */
export default function Flywheel({
  activeUsers,
  poolEurosToday,
  avgUserDailyEuros,
}: {
  activeUsers: number
  poolEurosToday: number
  avgUserDailyEuros: number
}) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Dynamique communauté</h3>
        <span className="text-[10px] text-emerald-300">en temps réel</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xl font-bold">{activeUsers.toLocaleString('fr-FR')}</div>
          <div className="text-[10px] text-white/50">actifs aujourd&apos;hui</div>
        </div>
        <div>
          <div className="text-xl font-bold">{poolEurosToday.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
          <div className="text-[10px] text-white/50">pool du jour</div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-300">+{avgUserDailyEuros.toFixed(2)} €</div>
          <div className="text-[10px] text-white/50">/ user / jour</div>
        </div>
      </div>

      <p className="text-xs text-white/60 text-center pt-1">
        Plus on est nombreux, plus chacun gagne.
      </p>
    </div>
  )
}
