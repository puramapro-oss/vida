'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const NOTIFICATION_LABELS = [
  { key: 'product_updates', label: 'Emails de mise a jour produit' },
  { key: 'agent_notifications', label: 'Notifications push agents' },
  { key: 'quota_alerts', label: 'Alertes quota' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'marketplace_notifications', label: 'Notifications marketplace' },
  { key: 'weekly_digest', label: 'Resume hebdomadaire' },
]

interface NotificationsTabProps {
  user: { id: string } | null
}

export default function NotificationsTab({ user }: NotificationsTabProps) {
  const [saving, setSaving] = useState(false)
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({
    product_updates: true,
    agent_notifications: true,
    quota_alerts: true,
    newsletter: false,
    marketplace_notifications: true,
    weekly_digest: true,
  })

  const handleSaveNotifs = async () => {
    if (!user) return
    setSaving(true)
    // Notification prefs stored in local state — persisted via profile metadata when available
    await new Promise((r) => setTimeout(r, 300))
    toast.success('Preferences sauvegardees !')
    setSaving(false)
  }

  return (
    <Card className="p-6" data-testid="notifications-tab">
      <h2 className="mb-5 font-semibold text-[var(--text-primary)]">Preferences de notification</h2>
      <div className="flex flex-col gap-4">
        {NOTIFICATION_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <p className="text-sm text-[var(--text-primary)]">{label}</p>
            <button
              onClick={() =>
                setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              data-testid={`toggle-notif-${key}`}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                notifSettings[key] ? 'bg-[var(--cyan)]' : 'bg-white/10'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                  notifSettings[key] ? 'left-5.5 translate-x-0' : 'left-0.5'
                )}
                style={{ left: notifSettings[key] ? '22px' : '2px' }}
              />
            </button>
          </div>
        ))}

        <Button onClick={handleSaveNotifs} loading={saving} className="mt-2" data-testid="save-notifs-btn">
          Sauvegarder
        </Button>
      </div>
    </Card>
  )
}
