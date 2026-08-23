'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Copy, Check, Share2, Users } from 'lucide-react'
import { APP_DOMAIN } from '@/lib/constants'

interface Props {
  referralCode: string | null
  filleuls: number
  earnings: number
  fadeUp: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function ReferralBlock({ referralCode, filleuls, earnings, fadeUp }: Props) {
  const [copied, setCopied] = useState(false)

  const code = referralCode ?? ''
  const referralLink = code
    ? `https://${APP_DOMAIN}/go/${code}`
    : `https://${APP_DOMAIN}/signup`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Lien copié 🌱')
      setTimeout(() => setCopied(false), 2200)
    } catch {
      toast.error('Impossible de copier — appuie longuement sur le lien.')
    }
  }

  async function shareLink() {
    const shareData = {
      title: 'Rejoins VIDA',
      text: 'VIDA transforme tes actions en impact réel. Rejoins-moi 🌱',
      url: referralLink,
    }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData)
      } catch {
        void copyLink()
      }
    } else {
      void copyLink()
    }
  }

  return (
    <motion.article
      variants={fadeUp}
      data-testid="block-referral"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 md:p-6"
    >
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[var(--emerald)]/25 blur-3xl pointer-events-none" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--emerald)]/30 to-[var(--sage,#34d399)]/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-[var(--emerald,#10B981)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Parrainage</h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {filleuls === 0
            ? 'Ton premier filleul te rapporte jusqu\'à 25 € + 1 mois offert.'
            : `Tu as semé ${filleuls} graine${filleuls > 1 ? 's' : ''}. Continue 🌱`}
        </p>

        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-xl bg-white/5 border border-white/10 p-2">
            <QRCodeSVG
              value={referralLink}
              size={72}
              bgColor="transparent"
              fgColor="#10B981"
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <button
              onClick={copyLink}
              data-testid="copy-referral-link"
              className="w-full flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs hover:bg-white/10 transition"
              aria-label="Copier le lien de parrainage"
            >
              <span className="truncate text-[var(--text-primary)] font-mono flex-1 text-left">
                {referralLink.replace(/^https?:\/\//, '')}
              </span>
              {copied ? (
                <Check className="h-4 w-4 text-[var(--emerald,#10B981)] shrink-0" />
              ) : (
                <Copy className="h-4 w-4 text-white/50 shrink-0" />
              )}
            </button>
            <button
              onClick={shareLink}
              data-testid="share-referral"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--emerald,#10B981)] to-[var(--sage,#34d399)] px-3 py-2 text-xs font-semibold text-black hover:opacity-90 transition"
            >
              <Share2 className="h-4 w-4" />
              Partager mon lien
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <div>
            <div className="text-white/40">Filleuls</div>
            <div className="text-lg font-semibold text-[var(--text-primary)]" data-testid="referral-count">
              {filleuls}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/40">Gains cumulés</div>
            <div className="text-lg font-semibold text-[var(--emerald,#10B981)]" data-testid="referral-earnings">
              {earnings.toFixed(2)} €
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
