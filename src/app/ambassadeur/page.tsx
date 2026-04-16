import Link from 'next/link'
import { Crown, Sparkles, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programme Ambassadeur VIDA — Gagne jusqu\'à 200 000 € en semant VIDA',
  description:
    'Deviens Ambassadeur Purama. 9 paliers de Bronze à Éternel. Commissions 50% / 15% / 7% à vie. Transmission héréditaire dès Légende.',
}

type Tier = {
  key: string
  name: string
  filleuls: number
  primeEur: number
  color: string
  perks: string[]
}

const TIERS: Tier[] = [
  { key: 'bronze', name: 'Bronze', filleuls: 10, primeEur: 200, color: 'from-amber-700 to-amber-500',
    perks: ['Abo Starter à vie', 'Badge profil', 'Academy Niv1 (2h)'] },
  { key: 'argent', name: 'Argent', filleuls: 25, primeEur: 500, color: 'from-zinc-400 to-zinc-200',
    perks: ['Abo Pro à vie', 'Early access 7j', 'Academy Niv2 (6h)'] },
  { key: 'or', name: 'Or', filleuls: 50, primeEur: 1_000, color: 'from-yellow-500 to-amber-300',
    perks: ['Abo Unlimited à vie', 'Page perso publique', 'Liens de kit vidéo'] },
  { key: 'platine', name: 'Platine', filleuls: 100, primeEur: 2_500, color: 'from-slate-300 to-white',
    perks: ['Abo Enterprise à vie', 'Feature prioritaire', 'Événements privés'] },
  { key: 'diamant', name: 'Diamant', filleuls: 250, primeEur: 6_000, color: 'from-cyan-300 to-white',
    perks: ['Statut VIP', 'Accès beta', 'Mentorat 1:1'] },
  { key: 'legende', name: 'Légende', filleuls: 500, primeEur: 12_000, color: 'from-purple-500 to-pink-400',
    perks: ['Commissions héréditaires (Purama Legacy)', 'Beta produits', 'Retraite annuelle'] },
  { key: 'titan', name: 'Titan', filleuls: 1_000, primeEur: 25_000, color: 'from-fuchsia-500 to-violet-400',
    perks: ['Ligne Tissma directe', 'Co-création features', 'Placements dédiés'] },
  { key: 'dieu', name: 'Dieu', filleuls: 5_000, primeEur: 100_000, color: 'from-[#10B981] to-emerald-300',
    perks: ['Rente trimestrielle 1%', 'Sponsoring Season', 'Masterclass privée'] },
  { key: 'eternel', name: 'Éternel', filleuls: 10_000, primeEur: 200_000, color: 'from-white to-[#10B981]',
    perks: ['1% parts — transmissible', 'Table ronde Tissma', 'Écrit dans le fondement Purama'] },
]

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' €'
}

export default function AmbassadeurPage() {
  return (
    <main className="min-h-screen px-4 py-16 md:py-24 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[var(--emerald)]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-[var(--sage,#34d399)]/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-14">
        <header className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs tracking-widest uppercase text-[var(--emerald,#10B981)]">
            <Crown className="h-3.5 w-3.5" />
            Programme Ambassadeur
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-light tracking-tight">
            Sème VIDA.<br />Récolte jusqu&apos;à{' '}
            <span className="text-[var(--emerald,#10B981)]">200 000 €</span>.
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            9 paliers. Commissions à vie 50% / 15% / 7% sur 3 niveaux. Dès Légende, les commissions deviennent héréditaires (Purama Legacy).
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/ambassadeur/apply"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#34d399] px-7 py-3.5 text-sm font-semibold text-black hover:opacity-90 transition"
            >
              Postuler comme Ambassadeur
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-7 py-3.5 text-sm hover:bg-white/5 transition"
            >
              Voir l&apos;offre VIDA
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <article
              key={t.key}
              className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 hover:border-white/20 transition overflow-hidden"
            >
              <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${t.color} opacity-20 blur-2xl pointer-events-none`} />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">#{i + 1}</span>
                    <h3 className="text-xl font-semibold">{t.name}</h3>
                  </div>
                  <Sparkles className="h-4 w-4 text-[var(--emerald,#10B981)]" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{formatEur(t.primeEur)}</div>
                  <div className="text-xs text-white/50 mt-1">
                    dès {t.filleuls.toLocaleString('fr-FR')} filleuls actifs
                  </div>
                </div>
                <ul className="text-sm text-white/70 space-y-1.5">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span className="text-[var(--emerald,#10B981)] mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
          <h2 className="text-2xl md:text-3xl font-semibold">Comment ça marche</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {[
              ['Postule', 'Remplis le formulaire. Acceptation manuelle <48h. Aucune audience minimum exigée.'],
              ['Sème', 'Partage ton lien unique. Commission 50% du 1er paiement, 15% N2, 7% N3 — à vie.'],
              ['Récolte', 'Paliers débloqués = prime directe sur ton wallet. Paliers cumulables.'],
            ].map(([title, body], idx) => (
              <li key={title} className="space-y-2">
                <div className="text-5xl font-light text-[var(--emerald,#10B981)]/70">{idx + 1}</div>
                <div className="font-semibold">{title}</div>
                <p className="text-sm text-white/60 leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3 text-center">
          <p className="text-xs text-white/40 max-w-2xl mx-auto leading-relaxed">
            Commission versée après 30 jours d&apos;activité réelle du filleul (anti-fraude).
            Paliers validés uniquement sur filleuls actifs (abonnement payant en cours).
            Programme soumis aux CGV ambassadeur. Purama se réserve le droit de refuser toute candidature sans justification.
          </p>
        </section>
      </div>
    </main>
  )
}
