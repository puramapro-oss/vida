'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function ConfirmationPage() {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setShowConfetti(true)
    // Deep link to mobile app if present
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = 'purama://activate'
      }
    }, 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 23) % 100}%`,
                animationDelay: `${(i % 6) * 150}ms`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-6 relative">
        <div className="text-5xl">✨</div>
        <h1 className="text-3xl font-semibold">Bienvenue dans VIDA</h1>
        <p className="text-white/70 text-sm">
          Ton abonnement est actif et <strong>25 € ont été crédités</strong> sur ton wallet.
          Les deux prochaines tranches (25 € puis 50 €) arrivent automatiquement à J+30 et J+60.
        </p>

        <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Palier 1 — aujourd&apos;hui</span>
            <span className="text-[var(--color-accent)] font-semibold">+25 € ✓</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Palier 2 — dans 30 jours</span>
            <span className="text-white/40">+25 €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Palier 3 — dans 60 jours</span>
            <span className="text-white/40">+50 €</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard">
            <Button fullWidth>Accéder à mon espace</Button>
          </Link>
          <Link href="/dashboard/wallet" className="text-xs text-white/50 hover:text-white">
            Voir mon wallet →
          </Link>
        </div>

        <p className="text-[10px] text-white/40 leading-snug">
          Retrait disponible après 30 jours d&apos;abonnement actif (art. L221-28 Code conso).
        </p>
      </div>
    </main>
  )
}
