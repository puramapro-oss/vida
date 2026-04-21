'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Check, Trash2, MessageSquare, Mail, RefreshCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'posts' | 'contacts'

interface Post {
  id: string
  content: string
  type: string
  moderated: boolean
  created_at: string
  user_id: string
}

interface ContactMsg {
  id: string
  name: string
  email: string
  subject: string
  message: string
  sent_at: string
  responded: boolean
}

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [contacts, setContacts] = useState<ContactMsg[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const [postsRes, contactsRes] = await Promise.all([
      supabase.from('community_posts').select('*').eq('moderated', false).order('created_at', { ascending: false }).limit(50),
      supabase.from('contact_messages').select('*').order('sent_at', { ascending: false }).limit(50),
    ])
    if (postsRes.data) setPosts(postsRes.data as Post[])
    if (contactsRes.data) setContacts(contactsRes.data as ContactMsg[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const approvePost = async (id: string) => {
    const { error } = await supabase.from('community_posts').update({ moderated: true }).eq('id', id)
    if (error) { toast.error('Erreur lors de la validation'); return }
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Post approuvé et visible dans la communauté')
  }

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('community_posts').delete().eq('id', id)
    if (error) { toast.error('Erreur lors de la suppression'); return }
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Post supprimé')
  }

  const markResponded = async (id: string) => {
    const { error } = await supabase.from('contact_messages').update({ responded: true }).eq('id', id)
    if (error) { toast.error('Erreur'); return }
    setContacts(prev => prev.map(c => c.id === id ? { ...c, responded: true } : c))
    toast.success('Marqué comme répondu')
  }

  const TYPE_COLOR: Record<string, string> = {
    victory: 'text-amber-400',
    gratitude: 'text-pink-400',
    encouragement: 'text-sky-400',
    milestone: 'text-violet-400',
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Link href="/admin" className="rounded-lg bg-white/5 border border-white/10 p-2 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-light">Modération</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">File de modération communauté & messages contact.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'posts', label: 'Posts communauté', icon: Shield, count: posts.length },
          { key: 'contacts', label: 'Messages contact', icon: Mail, count: contacts.filter(c => !c.responded).length },
        ] as { key: Tab; label: string; icon: React.ElementType; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
              tab === t.key
                ? 'bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20'
                : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/10'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 rounded-full bg-amber-400/20 text-amber-400 text-xs px-1.5 py-0.5">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--emerald)]" />
        </div>
      ) : tab === 'posts' ? (
        <section>
          {posts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Shield className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="font-medium text-[var(--text-primary)]">File vide — l'énergie circule librement</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Aucun post en attente de modération.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="glass-card-static rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('text-xs font-medium uppercase tracking-wider', TYPE_COLOR[post.type] ?? 'text-white')}>
                          {post.type}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => approvePost(post.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 text-xs hover:bg-emerald-500/20 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Approuver
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 text-xs hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          {contacts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <MessageSquare className="h-10 w-10 text-sky-400 mx-auto mb-3" />
              <p className="font-medium text-[var(--text-primary)]">Aucun message reçu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map(msg => (
                <div key={msg.id} className={cn('glass-card-static rounded-2xl p-5', msg.responded && 'opacity-50')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-[var(--text-primary)] text-sm">{msg.name}</p>
                        <span className="text-xs text-[var(--text-muted)]">{msg.email}</span>
                        {msg.responded && <span className="text-xs text-emerald-400">✓ répondu</span>}
                      </div>
                      <p className="text-xs text-sky-400 font-medium mb-2">{msg.subject}</p>
                      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        {new Date(msg.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!msg.responded && (
                      <div className="flex gap-2 shrink-0">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                          className="flex items-center gap-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-2 text-xs hover:bg-sky-500/20 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" /> Répondre
                        </a>
                        <button
                          onClick={() => markResponded(msg.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 text-xs hover:bg-emerald-500/20 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" /> Marquer répondu
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
