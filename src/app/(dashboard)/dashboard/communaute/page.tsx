'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Sparkles, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Post {
  id: string
  user_id: string | null
  content: string
  type: string | null
  likes_count: number | null
  comments_count: number | null
  created_at: string
}

const TYPES = [
  { id: 'victory', label: 'Une victoire', emoji: '🌟' },
  { id: 'gratitude', label: 'Une gratitude', emoji: '✨' },
  { id: 'encouragement', label: 'Un encouragement', emoji: '💜' },
  { id: 'milestone', label: 'Un cap franchi', emoji: '🌱' },
]

export default function CommunautePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [type, setType] = useState<string>('victory')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('community_posts')
      .select('*')
      .eq('moderated', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setPosts((data ?? []) as Post[]))
      .then(() => setLoading(false))
  }, [])

  const submit = async () => {
    if (content.trim().length < 3) {
      setError('Un mot, une pensée, un souffle.')
      return
    }
    setError(null)
    setPosting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Connecte-toi pour partager.')
        return
      }
      const { data, error: insErr } = await supabase
        .from('community_posts')
        .insert({ user_id: user.id, content: content.trim(), type })
        .select('*')
        .single()
      if (insErr) {
        setError('Impossible de publier. Réessaie dans un instant.')
        return
      }
      setPosts([data as Post, ...posts])
      setContent('')
    } catch {
      setError('Connexion impossible.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3"><Users className="h-3.5 w-3.5" /> Mur d'amour</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Ce qu'on vit, on le partage.
        </h1>
        <p className="text-[var(--text-secondary)]">
          Une victoire, une gratitude, un élan. Ici, personne ne se juge. On se soulève.
        </p>
      </header>

      {/* Composer */}
      <section className="glass-card-static rounded-3xl p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                type === t.id ? 'bg-[var(--emerald)] text-[#052e16]' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Écris ce qui veut être dit…"
          rows={3}
          maxLength={600}
          data-testid="community-input"
          className="w-full rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3 text-[var(--text-primary)] input-glow resize-none placeholder:text-[var(--text-muted)]"
        />
        {error && <p className="text-sm text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{error}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[var(--text-muted)]">{content.length}/600</span>
          <button
            onClick={submit}
            disabled={posting || content.trim().length < 3}
            data-testid="community-post"
            className="rounded-xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <Send className="h-3.5 w-3.5" /> {posting ? 'Je partage…' : 'Partager'}
          </button>
        </div>
      </section>

      {/* Wall */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : posts.length === 0 ? (
        <div className="glass-card-static rounded-3xl p-10 text-center">
          <Sparkles className="h-10 w-10 text-[var(--emerald)] mx-auto mb-4" />
          <p className="text-[var(--text-primary)] font-medium mb-2">Sois la première voix.</p>
          <p className="text-sm text-[var(--text-muted)]">Partage une victoire, aussi petite soit-elle. Quelqu'un en a besoin aujourd'hui.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {posts.map(p => {
              const meta = TYPES.find(t => t.id === p.type) ?? TYPES[0]
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] leading-relaxed mb-3">{p.content}</p>
                      <div className="flex items-center justify-between">
                        <time className="text-xs text-[var(--text-muted)]">
                          {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </time>
                        <button className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--rose)] transition-colors">
                          <Heart className="h-3.5 w-3.5" /> {p.likes_count ?? 0}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
