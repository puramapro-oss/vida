import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, Activity, Euro, Heart, MessageSquare, Shield, Sparkles } from 'lucide-react'

async function getStats() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
      db: { schema: 'vida_sante' },
    },
  )

  const [users, missions, posts, escalations, rituals] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('mission_completions').select('id', { count: 'exact', head: true }),
    supabase.from('community_posts').select('id, moderated', { count: 'exact' }).eq('moderated', false).limit(10),
    supabase.from('support_escalations').select('id, name, email, message, sent_at, responded').order('sent_at', { ascending: false }).limit(10),
    supabase.from('weekly_rituals').select('id, title, participants_count, scheduled_at').order('scheduled_at', { ascending: false }).limit(5),
  ])

  return {
    usersCount: users.count ?? 0,
    missionsCount: missions.count ?? 0,
    pendingModerationCount: posts.count ?? 0,
    pendingPosts: (posts.data ?? []) as { id: string; moderated: boolean }[],
    escalations: (escalations.data ?? []) as { id: string; name: string; email: string; message: string; sent_at: string; responded: boolean }[],
    rituals: (rituals.data ?? []) as { id: string; title: string; participants_count: number | null; scheduled_at: string }[],
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  const STATS = [
    { label: 'Utilisateurs', value: stats.usersCount, icon: Users, color: 'text-emerald-400' },
    { label: 'Missions validées', value: stats.missionsCount, icon: Activity, color: 'text-lime-400' },
    { label: 'Posts à modérer', value: stats.pendingModerationCount, icon: Shield, color: 'text-amber-400' },
    { label: 'Support en attente', value: stats.escalations.filter(e => !e.responded).length, icon: MessageSquare, color: 'text-rose-400' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Cockpit VIDA
        </h1>
        <p className="text-[var(--text-secondary)]">Tout ce qui bouge dans l'écosystème. En temps réel.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="impact-counter text-2xl md:text-3xl">{s.value.toLocaleString('fr-FR')}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card-static rounded-3xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" /> Modération communauté
          </h2>
          {stats.pendingModerationCount === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 text-[var(--emerald)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">Aucun post en attente. L'énergie circule.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {stats.pendingModerationCount} post{stats.pendingModerationCount > 1 ? 's' : ''} à valider.
              </p>
              <Link
                href="/admin/moderation"
                className="inline-flex items-center gap-1 text-sm text-[var(--emerald)] hover:underline"
              >
                Ouvrir la file de modération →
              </Link>
            </div>
          )}
        </div>

        <div className="glass-card-static rounded-3xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-rose-400" /> Support — escalations
          </h2>
          {stats.escalations.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Tout le monde va bien ✨</p>
          ) : (
            <ul className="space-y-2">
              {stats.escalations.slice(0, 5).map(e => (
                <li key={e.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.name}</p>
                    {e.responded ? (
                      <span className="text-xs text-emerald-400 shrink-0">✓ répondu</span>
                    ) : (
                      <span className="text-xs text-amber-400 shrink-0">en attente</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{e.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(e.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="glass-card-static rounded-3xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-400" /> Rituels collectifs
        </h2>
        {stats.rituals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Aucun rituel planifié. Temps de remettre le cœur en mouvement.</p>
        ) : (
          <div className="space-y-2">
            {stats.rituals.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{r.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(r.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs text-[var(--emerald)] shrink-0 inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {r.participants_count ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Euro className="h-5 w-5 text-[var(--emerald)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Finance & pools</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Split 50/10/40 actif. Pool users, Association PURAMA, SASU — tout automatique via webhook Stripe.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link href="/admin/finance" className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:bg-white/10">
                Voir les pools
              </Link>
              <Link href="/admin/users" className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:bg-white/10">
                Gérer les utilisateurs
              </Link>
              <Link href="/admin/missions" className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:bg-white/10">
                Missions & proofs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
