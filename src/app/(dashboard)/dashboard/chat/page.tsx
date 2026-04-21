'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Leaf } from 'lucide-react'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'Suis-je éligible au RSA ? Je travaille à temps partiel.',
  'Comment demander l\'AAH à la MDPH ?',
  'J\'ai perdu mon emploi — quelles aides puis-je toucher ?',
  'Puis-je cumuler APL et prime d\'activité ?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setInput('')
    setLoading(true)

    // Placeholder assistant entry (will stream into it)
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, conversationId: convId ?? undefined }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Erreur' }))
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: err.error || 'Petit détour, réessaie dans un instant.' }
          return copy
        })
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() || ''
        for (const l of lines) {
          const d = l.replace(/^data:\s*/, '').trim()
          if (!d || d === '[DONE]') continue
          try {
            const ev = JSON.parse(d)
            if (ev.conversationId) setConvId(ev.conversationId)
            if (ev.text) {
              setMessages(m => {
                const copy = [...m]
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: (copy[copy.length - 1]?.content ?? '') + ev.text,
                }
                return copy
              })
            }
            if (ev.error) {
              setMessages(m => {
                const copy = [...m]
                copy[copy.length - 1] = { role: 'assistant', content: `Petit détour : ${ev.error}` }
                return copy
              })
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(m => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: 'Connexion impossible. Ton espace t\'attend, reviens.' }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[var(--emerald)]/30 to-[var(--sage)]/10 flex items-center justify-center mb-6">
            <Leaf className="h-7 w-7 text-[var(--emerald)]" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-3">
            Je suis VIDA.
          </h1>
          <p className="text-[var(--text-secondary)] max-w-md mb-8">
            Expert en droits sociaux. Pose ta question sur tes aides, allocations ou démarches administratives.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
            {STARTERS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                data-testid={`starter-${s.slice(0, 10)}`}
                className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 text-sm text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 hover:border-[var(--emerald)]/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-1 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-[var(--emerald)] to-[var(--sage)] text-white'
                    : 'bg-white/5 border border-[var(--border)] text-[var(--text-primary)]'
                }`}>
                  {m.content || (loading && i === messages.length - 1 ? (
                    <span className="inline-flex items-center gap-2 text-[var(--text-muted)]">
                      <Sparkles className="h-3 w-3 animate-breathe" /> VIDA prépare une réponse…
                    </span>
                  ) : null)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      )}

      <div className="sticky bottom-0 pt-3 pb-2 bg-gradient-to-t from-[var(--bg-void)] via-[var(--bg-void)] to-transparent">
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-white/5 backdrop-blur-xl p-2 focus-within:border-[var(--emerald)]/40 transition-colors"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="Pose ta question sur tes droits, aides ou démarches…"
            rows={1}
            data-testid="chat-input"
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none max-h-32"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            data-testid="chat-send"
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--emerald)] to-[var(--sage)] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
