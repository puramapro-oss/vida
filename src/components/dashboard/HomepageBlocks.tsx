'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ReferralBlock from './ReferralBlock'
import AmbassadorBlock from './AmbassadorBlock'
import CrossPromoBlock from './CrossPromoBlock'

type Profile = {
  id: string
  referral_code: string | null
  full_name: string | null
  pseudo: string | null
}

interface Props {
  user: User | null
  profile: Profile | null
}

// VIDA → KAÏA (primary wellness cross-promo), PRANA (fallback)
const CROSS_PROMO_TARGETS = [
  {
    slug: 'kaia',
    domain: 'https://kaia.purama.dev',
    name: 'KAÏA',
    tagline: 'Ton médecin IA bienveillant, 24h/24',
    accent: 'from-cyan-500/30 to-teal-400/20',
  },
  {
    slug: 'prana',
    domain: 'https://prana.purama.dev',
    name: 'PRANA',
    tagline: 'Respiration, méditation, cohérence cardiaque',
    accent: 'from-rose-400/30 to-pink-400/20',
  },
] as const

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function HomepageBlocks({ user, profile }: Props) {
  const [filleuls, setFilleuls] = useState<number>(0)
  const [earnings, setEarnings] = useState<number>(0)
  const [target, setTarget] = useState<(typeof CROSS_PROMO_TARGETS)[number]>(CROSS_PROMO_TARGETS[0])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function load() {
      const { data: refs } = await supabase
        .from('referrals')
        .select('id, active, first_payment_commission_cents')
        .eq('referrer_id', user!.id)

      const list = refs ?? []
      setFilleuls(list.length)
      const totalCents = list.reduce(
        (sum, r) => sum + (typeof r.first_payment_commission_cents === 'number' ? r.first_payment_commission_cents : 0),
        0,
      )
      setEarnings(totalCents / 100)
    }
    void load()
  }, [user])

  useEffect(() => {
    // rotate KAÏA/PRANA deterministically per day (no SSR flash)
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
    queueMicrotask(() => setTarget(CROSS_PROMO_TARGETS[day % CROSS_PROMO_TARGETS.length]))
  }, [])

  return (
    <motion.section
      data-testid="homepage-blocks"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="grid gap-4 md:gap-5 lg:grid-cols-3"
    >
      <ReferralBlock
        referralCode={profile?.referral_code ?? null}
        filleuls={filleuls}
        earnings={earnings}
        fadeUp={fadeUp}
      />
      <AmbassadorBlock
        filleuls={filleuls}
        fadeUp={fadeUp}
      />
      <CrossPromoBlock
        target={target}
        fadeUp={fadeUp}
      />
    </motion.section>
  )
}
