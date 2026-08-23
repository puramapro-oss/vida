'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DataTabProps {
  user: { id: string } | null
}

export default function DataTab({ user }: DataTabProps) {
  const router = useRouter()
  const [exportingData, setExportingData] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'history' | null>(null)
  const supabase = createClient()

  const handleExportData = async () => {
    setExportingData(true)
    try {
      const res = await fetch('/api/legal/my-data')
      if (!res.ok) throw new Error(`Export impossible (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vida-mes-donnees.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé.')
    } catch {
      toast.error("L'export a échoué, réessaie plus tard.")
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteHistory = async () => {
    if (!user) return
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', user.id)
    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Historique supprime !')
      setShowDeleteConfirm(null)
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="data-tab">
      <Card className="p-6">
        <h2 className="mb-2 font-semibold text-[var(--text-primary)]">Exporter mes donnees</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Recois un export JSON de toutes tes donnees (RGPD).
        </p>
        <Button
          variant="secondary"
          onClick={handleExportData}
          loading={exportingData}
          data-testid="export-data-btn"
        >
          Exporter mes donnees
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
          Supprimer mon historique
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Supprime toutes tes conversations et messages. Cette action est irreversible.
        </p>
        <Button
          variant="danger"
          onClick={() => setShowDeleteConfirm('history')}
          data-testid="delete-history-btn"
        >
          Supprimer l&apos;historique
        </Button>
      </Card>

      <Card className="p-6 border border-red-500/20">
        <h2 className="mb-2 font-semibold text-red-400">Supprimer mon compte</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Consulte tes donnees, exporte-les et programme la suppression definitive de ton compte
          (periode de grace 30 jours, annulable a tout moment).
        </p>
        <Button
          variant="danger"
          onClick={() => router.push('/dashboard/ma-memoire')}
          data-testid="delete-account-data-btn"
        >
          Gerer / supprimer mon compte
        </Button>
      </Card>

      {showDeleteConfirm === 'history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] p-6 shadow-xl">
            <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Confirmer la suppression</h3>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Es-tu sur de vouloir supprimer tout ton historique ? Cette action est irreversible.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDeleteHistory}>
                Oui, supprimer
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
