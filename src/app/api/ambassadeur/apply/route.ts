import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const ApplySchema = z.object({
  full_name: z.string().min(2, 'Nom trop court').max(120),
  email: z.string().email('Email invalide'),
  social_links: z.string().max(500).optional().nullable(),
  motivation: z.string().min(20, 'Dis-nous en un peu plus (20 caractères min).').max(2000),
  audience_size: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown
    const parsed = ApplySchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Formulaire invalide.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const service = createServiceClient()
    const { error } = await service.from('ambassador_applications').insert({
      user_id: user?.id ?? null,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      social_links: parsed.data.social_links ?? null,
      motivation: parsed.data.motivation,
      audience_size: parsed.data.audience_size ?? null,
      status: 'pending',
    })

    if (error) {
      return NextResponse.json({ error: 'Impossible d\'enregistrer ta candidature. Réessaie dans un instant.' }, { status: 500 })
    }

    // Fire-and-forget: notify super admin via Resend if configured.
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      void fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'VIDA <contact@purama.dev>',
          to: ['matiss.frasne@gmail.com'],
          subject: `[VIDA] Candidature Ambassadeur — ${parsed.data.full_name}`,
          text: `Nom: ${parsed.data.full_name}\nEmail: ${parsed.data.email}\nRéseaux: ${parsed.data.social_links ?? '—'}\nAudience: ${parsed.data.audience_size ?? '—'}\n\nMotivation:\n${parsed.data.motivation}`,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur inattendue. Réessaie dans quelques instants.' }, { status: 500 })
  }
}
