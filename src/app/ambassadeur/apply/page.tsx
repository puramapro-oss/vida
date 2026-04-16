'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

export default function AmbassadeurApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      full_name: String(data.get('full_name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      social_links: String(data.get('social_links') ?? '').trim(),
      motivation: String(data.get('motivation') ?? '').trim(),
      audience_size: Number(data.get('audience_size') ?? 0) || null,
    }

    if (!payload.full_name || !payload.email || !payload.motivation) {
      setError('Remplis ton nom, email et ta motivation — merci !')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/ambassadeur/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Envoi impossible pour le moment.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-16 md:py-24 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[var(--emerald)]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-xl mx-auto">
        <Link
          href="/ambassadeur"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au programme
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-10">
          {submitted ? (
            <div className="text-center space-y-5 py-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--emerald)]/15 flex items-center justify-center">
                <Check className="h-8 w-8 text-[var(--emerald,#10B981)]" />
              </div>
              <h1 className="text-2xl font-semibold">Ta candidature est semée 🌱</h1>
              <p className="text-white/70 text-sm leading-relaxed">
                On lit chaque dossier personnellement. Tu reçois une réponse sous 48 heures.
                En attendant, explore VIDA et commence à partager ton univers.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#34d399] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <h1 className="text-3xl font-semibold">Postuler Ambassadeur</h1>
                <p className="text-white/60 text-sm mt-2">
                  Pas de minimum d&apos;audience. Ce qui compte : ta vision, ta voix, ta capacité à faire grandir une communauté.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-white/50">Nom complet</span>
                  <input
                    name="full_name"
                    type="text"
                    required
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[var(--emerald,#10B981)] outline-none transition"
                    placeholder="Prénom NOM"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-white/50">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[var(--emerald,#10B981)] outline-none transition"
                    placeholder="toi@exemple.com"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-white/50">Réseaux (facultatif)</span>
                  <input
                    name="social_links"
                    type="text"
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[var(--emerald,#10B981)] outline-none transition"
                    placeholder="instagram.com/toi, youtube.com/@toi, tiktok.com/@toi"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-white/50">Audience cumulée (facultatif)</span>
                  <input
                    name="audience_size"
                    type="number"
                    min="0"
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[var(--emerald,#10B981)] outline-none transition"
                    placeholder="0"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-white/50">
                    Pourquoi VIDA ? Qu&apos;est-ce qui te fait vibrer ?
                  </span>
                  <textarea
                    name="motivation"
                    required
                    rows={5}
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[var(--emerald,#10B981)] outline-none transition resize-none"
                    placeholder="Ton histoire en 3-5 phrases. Ce que tu veux transmettre. Comment tu comptes semer VIDA."
                  />
                </label>
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#10B981] to-[#34d399] px-6 py-3.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? 'Envoi…' : 'Envoyer ma candidature'}
              </button>

              <p className="text-[10px] text-white/40 leading-snug text-center">
                En envoyant, tu acceptes que Purama conserve ces données pour traiter ta candidature.
                Réponse sous 48h. Anti-fraude : les commissions ne se déclenchent qu&apos;après 30 jours d&apos;activité réelle du filleul.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
