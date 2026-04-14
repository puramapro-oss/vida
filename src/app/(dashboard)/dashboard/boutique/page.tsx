'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Heart, Brain, ShoppingBag, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  long_description: string | null
  price_cents: number
  subscriber_discount_percent: number | null
  cashback_points: number | null
  stock: number | null
  category: string | null
  is_active: boolean
}

const CAT_META: Record<string, { icon: typeof Leaf; label: string; bg: string }> = {
  ecology: { icon: Leaf, label: 'Écologie', bg: 'from-emerald-500/20 to-emerald-400/5' },
  health:  { icon: Heart, label: 'Santé', bg: 'from-rose-500/20 to-rose-400/5' },
  mind:    { icon: Brain, label: 'Mental', bg: 'from-violet-500/20 to-violet-400/5' },
}

export default function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError('Impossible de charger la boutique.')
        else setProducts((data ?? []) as Product[])
      })
      .then(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3"><ShoppingBag className="h-3.5 w-3.5" /> Boutique VIDA</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Des objets qui t'élèvent.
        </h1>
        <p className="text-[var(--text-secondary)]">Produits sélectionnés avec soin. Cashback en Graines VIDA à chaque achat.</p>
      </header>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-16 text-[var(--text-muted)] italic">L'espace de toutes les possibilités.</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {products.map(p => {
            const meta = CAT_META[p.category ?? 'ecology'] ?? CAT_META.ecology
            const euros = (p.price_cents / 100).toFixed(2).replace('.', ',')
            return (
              <motion.article
                key={p.id}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${meta.bg}`}
              >
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <meta.icon className="h-6 w-6 text-[var(--emerald)]" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{meta.label}</span>
                <h3 className="font-semibold text-[var(--text-primary)] text-lg mt-1 mb-2 leading-tight">{p.name}</h3>
                {p.description && <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">{p.description}</p>}
                <div className="flex items-end justify-between mb-4">
                  <p className="impact-counter text-2xl">{euros}€</p>
                  {(p.cashback_points ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--sage)]">
                      <Sparkles className="h-3 w-3" /> +{p.cashback_points} graines
                    </span>
                  )}
                </div>
                <button
                  data-testid={`buy-${p.slug}`}
                  onClick={() => alert('Bientôt : paiement sécurisé Stripe pour cet objet.')}
                  className="w-full rounded-xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 transition-all"
                >
                  Commander
                </button>
              </motion.article>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
