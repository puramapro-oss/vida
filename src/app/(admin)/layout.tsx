import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isSuperAdmin } from '@/lib/utils'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* noop in server component */ },
      },
      db: { schema: 'vida_sante' },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin')
  if (!isSuperAdmin(user.email)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full px-3 py-1">
            ◆ God Mode
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
