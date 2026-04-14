'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Check, Sparkles } from 'lucide-react'

interface Entry {
  id: string
  content: string
  mood: string | null
  created_at: string
}

const MOODS = ['✨', '🌱', '☀️', '🌊', '🔥', '💜'] as const

export default function GratitudePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/spiritual/gratitude')
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(d => setEntries(d.entries ?? []))
      .catch(() => { /* silent */ })
      .finally(() => setFetching(false))
  }, [])

  const submit = async () => {
    if (content.trim().length < 3) {
      setError('Prends au moins un instant pour nommer une chose.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/spiritual/gratitude', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), mood: mood || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Impossible d\'enregistrer.')
        return
      }
      setEntries([data.entry, ...entries])
      setContent('')
      setMood('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  const todayCount = entries.filter(e => new Date(e.created_at).toDateString() === new Date().toDateString()).length

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <header className="text-center">
        <div className="vida-chip mb-4 mx-auto inline-flex">
          <Heart className="h-3.5 w-3.5" /> {todayCount}/3 gratitudes aujourd'hui
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Merci, simplement.
        </h1>
        <p className="text-[var(--text-secondary)]">
          Une pensée, un visage, un instant. Poser sa gratitude change la texture d'une journée.
        </p>
      </header>

      <section className="glass-card-static rounded-3xl p-6 md:p-8">
        <label htmlFor="grat" className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          De quoi es-tu reconnaissant·e en cet instant ?
        </label>
        <textarea
          id="grat"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Pour ce café tiède, pour ce regard, pour…"
          rows={4}
          data-testid="gratitude-input"
          className="w-full rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3 text-[var(--text-primary)] input-glow resize-none placeholder:text-[var(--text-muted)]"
          maxLength={2000}
        />

        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-[var(--text-muted)]">Humeur :</span>
          {MOODS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? '' : m)}
              className={`h-9 w-9 rounded-full text-lg transition-all ${mood === m ? 'bg-[var(--emerald)]/20 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/5 hover:bg-white/10'}`}
              aria-label={`Humeur ${m}`}
            >
              {m}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-400 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>
        )}

        <div className="flex items-center justify-between mt-6">
          <span className="text-xs text-[var(--text-muted)]">{content.length}/2000</span>
          <button
            onClick={submit}
            disabled={loading || content.trim().length < 3}
            data-testid="gratitude-submit"
            className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? 'J\'enregistre…' : (<><Sparkles className="h-4 w-4" /> Poser ma gratitude</>)}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-sm text-[var(--emerald)] inline-flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" /> +100 XP d'éveil intégrés
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4">Mes gratitudes récentes</h2>
        {fetching ? (
          <p className="text-sm text-[var(--text-muted)] italic">Ton espace se prépare…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic text-center py-8">
            L'espace de toutes les possibilités.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map(e => (
              <div key={e.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  {e.mood && <span className="text-2xl shrink-0">{e.mood}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--text-primary)] leading-relaxed">{e.content}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
