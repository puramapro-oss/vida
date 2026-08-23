'use client'

import { useState } from 'react'
import { User, Bell, Shield, Palette, CreditCard, Database, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import ProfileTab from './tabs/ProfileTab'
import NotificationsTab from './tabs/NotificationsTab'
import SecurityTab from './tabs/SecurityTab'
import AppearanceTab from './tabs/AppearanceTab'
import BillingTab from './tabs/BillingTab'
import DataTab from './tabs/DataTab'

type Tab = 'profile' | 'notifications' | 'security' | 'appearance' | 'billing' | 'data'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'security', label: 'Securite', icon: <Shield className="h-4 w-4" /> },
  { id: 'appearance', label: 'Apparence', icon: <Palette className="h-4 w-4" /> },
  { id: 'billing', label: 'Facturation', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'data', label: 'Donnees', icon: <Database className="h-4 w-4" /> },
]

export default function SettingsPage() {
  const { user, profile, signOut, refetch } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div className="flex flex-col gap-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
          Parametres
        </h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Gere ton compte et tes preferences
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Tab Sidebar */}
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:w-48 lg:shrink-0" data-testid="settings-tabs">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              data-testid={`settings-tab-${id}`}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left',
                activeTab === id
                  ? 'bg-[var(--cyan)]/10 text-[var(--cyan)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              )}
            >
              {icon}
              {label}
            </button>
          ))}

          {/* Logout at bottom */}
          <div className="hidden lg:block mt-auto pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4" />
              Deconnexion
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab user={user} profile={profile} refetch={refetch} />}
          {activeTab === 'notifications' && <NotificationsTab user={user} />}
          {activeTab === 'security' && <SecurityTab user={user} />}
          {activeTab === 'appearance' && <AppearanceTab user={user} profile={profile} />}
          {activeTab === 'billing' && <BillingTab user={user} profile={profile} />}
          {activeTab === 'data' && <DataTab user={user} />}
        </div>
      </div>
    </div>
  )
}
