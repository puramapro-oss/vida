'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Home, Users, Wallet, Trophy, Ticket, Crown, Gift, Share2,
  Megaphone, Bell, BookOpen, User, Settings,
  ChevronLeft, ChevronRight, LogOut, Shield,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import LocaleSwitcher from '@/components/shared/LocaleSwitcher'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, key: 'home' },
  { href: '/dashboard/referral', icon: Users, key: 'referral' },
  { href: '/dashboard/wallet', icon: Wallet, key: 'wallet' },
  { href: '/dashboard/classement', icon: Crown, key: 'classement' },
  { href: '/dashboard/concours', icon: Trophy, key: 'concours' },
  { href: '/dashboard/tirage', icon: Ticket, key: 'tirage' },
  { href: '/dashboard/daily-gift', icon: Gift, key: 'dailyGift' },
  { href: '/dashboard/partage', icon: Share2, key: 'partage' },
  { href: '/dashboard/influenceur', icon: Megaphone, key: 'influenceur' },
  { href: '/dashboard/notifications', icon: Bell, key: 'notifications' },
  { href: '/dashboard/guide', icon: BookOpen, key: 'guide' },
  { href: '/dashboard/profile', icon: User, key: 'profile' },
  { href: '/dashboard/settings', icon: Settings, key: 'settings' },
] as const

const ADMIN_ITEM = { href: '/dashboard/admin', icon: Shield, key: 'admin' } as const

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const isSuperAdmin = profile?.email === SUPER_ADMIN_EMAIL || profile?.role === 'super_admin'
  const navItems = isSuperAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--bg-nebula)]/80 backdrop-blur-xl transition-all duration-300 lg:flex',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-[var(--border)] px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <Link href="/dashboard" className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold">
            VIDA
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
          aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 scrollbar-thin">
        {navItems.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${href.split('/').pop()}`}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center' : '',
                active
                  ? 'bg-[var(--emerald)]/10 text-[var(--emerald)] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              )}
              title={collapsed ? t(key) : undefined}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110', active && 'drop-shadow-[0_0_6px_var(--emerald)]')} />
              {!collapsed && <span className="truncate">{t(key)}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-2">
        {!collapsed && <LocaleSwitcher />}
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--sage)] text-sm font-semibold text-white">
              {getInitials(profile?.full_name ?? profile?.email ?? null)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {profile?.full_name ?? profile?.email ?? 'Utilisateur'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {tc('level')} {profile?.vida_level ?? 1}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label={tc('logout')}
              data-testid="logout-sidebar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--sage)] text-sm font-semibold text-white">
              {getInitials(profile?.full_name ?? profile?.email ?? null)}
            </div>
            <button
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label={tc('logout')}
              data-testid="logout-sidebar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
