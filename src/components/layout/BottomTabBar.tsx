'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, Users, Wallet, Gift, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', icon: Home, key: 'home' },
  { href: '/dashboard/referral', icon: Users, key: 'referral' },
  { href: '/dashboard/wallet', icon: Wallet, key: 'wallet' },
  { href: '/dashboard/daily-gift', icon: Gift, key: 'gift' },
  { href: '/dashboard/profile', icon: User, key: 'profile' },
] as const

export default function BottomTabBar() {
  const pathname = usePathname()
  const t = useTranslations('tabs')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--bg-nebula)]/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigation principale"
    >
      {TABS.map(({ href, icon: Icon, key }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
        return (
          <Link
            key={href}
            href={href}
            data-testid={`tab-${href.split('/').pop()}`}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all duration-200',
              active
                ? 'text-[var(--emerald)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 transition-transform duration-200',
              active && 'drop-shadow-[0_0_6px_var(--emerald)] scale-110'
            )} />
            <span>{t(key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
