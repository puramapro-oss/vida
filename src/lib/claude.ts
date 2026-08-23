import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { smarana } from '@purama/smarana'
import type { SmaranaTier } from '@purama/smarana'

export type Plan = 'free' | 'premium'

// Garder client Anthropic uniquement pour streamClaude (streaming hors périmètre smarana P0/P1)
let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _anthropic
}

const TOKEN_LIMITS: Record<Plan, number> = {
  free: 2048,
  premium: 8192,
}

const MODEL_MAP: Record<Plan, string> = {
  free: process.env.ANTHROPIC_MODEL_FAST ?? 'claude-haiku-4-5-20251001',
  premium: process.env.ANTHROPIC_MODEL_MAIN ?? 'claude-sonnet-4-6',
}

const PLAN_TO_TIER: Record<Plan, SmaranaTier> = {
  free: 'fast',
  premium: 'main',
}

export function getSystemPrompt(context?: { articles?: string[] }): string {
  const articlesBlock = context?.articles?.length
    ? `\n\nARTICLES DE LOI PERTINENTS (cite-les dans ta réponse) :\n${context.articles.join('\n')}`
    : ''

  return `Tu es VIDA, conseiller expert en droits sociaux et aides administratives françaises.

Tu as 20 ans d'expérience : CAF, Pôle Emploi (France Travail), DGFiP, CPAM, MDPH, MSA, CARSAT, CNAF, travailleurs frontaliers (Suisse/Luxembourg/Belgique/Allemagne).

RÈGLES ABSOLUES :
— Tu ne révèles JAMAIS que tu es Claude ou un modèle Anthropic. Tu ES VIDA.
— Tu CITES TOUJOURS l'article de loi ou le texte réglementaire quand tu affirmes un droit (ex : "Art. L5421-1 Code du travail", "Art. R351-3 Code sécu", "Décret n°2022-423").
— Tu ne INVENTES JAMAIS un montant, un délai, ou un droit. Si tu n'es pas certain, tu dis "Vérifie sur le site officiel de la CAF / Pôle Emploi / impots.gouv.fr".
— Tu renvoies TOUJOURS vers l'organisme officiel pour la démarche finale.
— Tu tutoies, en français, ton empathique. Tu utilises des emojis avec parcimonie 📋.

TES DOMAINES :
— Aides CAF : RSA, APL, AAH, AF, PAJE, APA, prime de naissance, aide au logement
— Pôle Emploi / France Travail : ARE, ASS, ATI, formation, CEP
— Fiscalité DGFiP : impôt sur le revenu, déclaration, exonérations, crédits d'impôt
— Santé CPAM : ALD, CMU-C, ACS, PUMA, remboursements, arrêts maladie
— Handicap MDPH : RQTH, AAH, PCH, AEEH, carte mobilité
— Retraite CARSAT : calcul pension, retraite anticipée, minimum contributif
— Agriculture MSA : prestations spécifiques agriculteurs
— Frontaliers : conventions bilatérales Suisse/LU/BE/DE, détachement, sécurité sociale applicable
— Argent oublié : comptes bancaires inactifs (Ciclade), assurances vie (Agira), cautions non restituées

STRUCTURE DE RÉPONSE :
1. Réponds directement à la question (droit applicable, montant estimé si connu)
2. Cite l'article de loi ou le texte réglementaire
3. Indique les conditions d'éligibilité clés
4. Renvoie vers l'organisme officiel pour la démarche
5. Propose une question de suivi si le dossier est complexe${articlesBlock}

Tu es VIDA. Expert. Précis. Au service des droits de chacun.`
}

// Loi 1 SMARANA-BRIEF.md : "Aucune app n'appelle l'API directement. Tout passe par smarana.ask()."
// VIDA ne détient plus de client Anthropic pour askClaude — mémoire cross-écosystème + cache + usage
// centralisés dans @purama/smarana (packages/smarana).
export async function askClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  plan: Plan = 'free',
  systemPrompt?: string,
  context?: { articles?: string[] },
  userId?: string
): Promise<string> {
  const system = systemPrompt ?? getSystemPrompt(context)
  const lastMsg = messages[messages.length - 1]
  const recentMessages = messages.length > 1 ? messages.slice(0, -1) : undefined

  const result = await smarana.ask({
    appSlug: 'vida_sante',
    userId,
    system,
    recentMessages,
    message: lastMsg?.content ?? '',
    tier: PLAN_TO_TIER[plan],
    maxTokens: TOKEN_LIMITS[plan],
  })
  return result.text
}

// streamClaude HORS PÉRIMÈTRE smarana P0/P1 (streaming non supporté) — garde SDK direct.
// Utilisé par api/chat/route.ts (conversations multi-tours streaming).
export async function* streamClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  plan: Plan = 'free',
  systemPrompt?: string,
  context?: { articles?: string[] }
): AsyncGenerator<string> {
  const stream = getAnthropic().messages.stream({
    model: MODEL_MAP[plan],
    max_tokens: TOKEN_LIMITS[plan],
    system: systemPrompt ?? getSystemPrompt(context),
    messages,
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

export async function askClaudeJSON<T>(
  prompt: string,
  plan: Plan = 'free',
  userId?: string
): Promise<T | null> {
  try {
    const result = await smarana.ask({
      appSlug: 'vida_sante',
      userId,
      system: 'Tu retournes UNIQUEMENT du JSON valide, sans texte avant ni après, sans markdown.',
      message: prompt,
      tier: PLAN_TO_TIER[plan],
      maxTokens: TOKEN_LIMITS[plan],
    })
    const clean = result.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    return JSON.parse(clean) as T
  } catch {
    return null
  }
}
