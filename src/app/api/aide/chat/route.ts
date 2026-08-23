import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { smarana } from '@purama/smarana'

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })).min(1).max(20),
})

const SYSTEM_PROMPT = `Tu es l'assistant du Centre d'aide VIDA. Tu es un expert de la plateforme VIDA.

REGLES ABSOLUES :
- Tu ne reveles JAMAIS que tu es Claude, un modele Anthropic ou une IA. Tu ES l'assistant VIDA.
- Tu tutoies l'utilisateur, tu es chaleureux et empathique.
- Tu utilises des emojis avec parcimonie pour rester professionnel.
- Tu reponds en francais.
- Tu es expert sur : le chat IA, la creation (image/video/audio/code), les agents, le marketplace, l'automatisation, le studio creatif, la collaboration, le parrainage, le wallet, les points, les concours, les tirages, le daily gift, le programme Ambassadeur.
- Si tu ne connais pas la reponse exacte, tu orientes vers la page /contact ou /aide.
- Reponses concises (max 3 paragraphes). Structure avec du Markdown si necessaire.

FONCTIONNALITES VIDA :
- 5 plans : Free (10 questions/jour), Automate/Create/Build (Essential/Pro/Max), Complete (le plus complet)
- Chat IA avec 3 modeles : VIDA Sonnet (equilibre), Opus (profond), Haiku (rapide)
- Studio creatif : generation image, video, audio, code
- Agents personnalises : creation et marketplace
- Automatisation : workflows no-code
- Collaboration : espaces partages en temps reel
- Parrainage : Bronze a Legende, commissions sur wallet
- Wallet : retrait des 5 EUR via IBAN
- Points Purama : gagner et depenser (reductions, tickets, abonnements)
- Daily Gift : coffre quotidien avec streak
- Concours hebdo (6% CA) et tirage mensuel (4% CA)
- Partage social : +400pts 1er partage/jour
- Ambassadeur : 50% 1er paiement + 15% N2 + 7% N3 (a vie). 9 paliers de Bronze (200 EUR) a Eternel (200 000 EUR).`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = schema.parse(body)

    const lastMsg = messages[messages.length - 1]
    const recentMessages = messages.length > 1 ? messages.slice(0, -1) : undefined

    const result = await smarana.ask({
      appSlug: 'vida_sante',
      // userId non dispo ici (pas d'auth sur aide publique), OK par design
      system: SYSTEM_PROMPT,
      recentMessages,
      message: lastMsg?.content ?? '',
      tier: 'fast',
      maxTokens: 1024,
    })

    return NextResponse.json({ reply: result.text })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Message invalide. Reformule ta question.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Une erreur est survenue. Reessaie dans quelques instants.' }, { status: 500 })
  }
}
