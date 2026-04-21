import Anthropic from '@anthropic-ai/sdk'

export type Plan = 'free' | 'premium'

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

export async function askClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  plan: Plan = 'free',
  systemPrompt?: string,
  context?: { articles?: string[] }
): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: MODEL_MAP[plan],
    max_tokens: TOKEN_LIMITS[plan],
    system: systemPrompt ?? getSystemPrompt(context),
    messages,
  })
  const block = response.content[0]
  if (block.type === 'text') return block.text
  return ''
}

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
  plan: Plan = 'free'
): Promise<T | null> {
  try {
    const response = await getAnthropic().messages.create({
      model: MODEL_MAP[plan],
      max_tokens: TOKEN_LIMITS[plan],
      system: 'Tu retournes UNIQUEMENT du JSON valide, sans texte avant ni après, sans markdown.',
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text') return null
    const clean = block.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    return JSON.parse(clean) as T
  } catch {
    return null
  }
}
