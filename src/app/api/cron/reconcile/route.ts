import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { Resend } from 'resend'
import { SUPER_ADMIN_EMAIL, ASSO_PERCENTAGE, REWARD_POOL_PERCENTAGE } from '@/lib/constants'

// Réconciliation wallet ↔ Stripe — ALERTE UNIQUEMENT, aucune correction
// automatique. vida_sante n'a NI `payments` NI `wallet_transactions` :
// le revenu passe par `transactions`, le split par `pool_balances`/
// `pool_transactions` (reward 50%/asso 10%, sasu non poolé), les primes
// par `prime_payouts`, le parrainage par `referral_earnings`.
//
// `profiles.wallet_balance`/`pending_earnings` sont du CODE MORT
// (jamais écrits nulle part dans le repo, seulement lus côté dashboard)
// et la table `wallets` (utilisée par le webhook pour créditer la
// tranche 1 de prime) N'EXISTE PAS EN LIVE — même famille de gap que
// satya. Ni l'un ni l'autre corrigés ici (hors périmètre de ce commit,
// documenté dans ERRORS.md) : ce cron ne les vérifie donc pas, il
// vérifie les tables qui existent réellement et fonctionnent.

const WINDOW_DAYS = 7
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@vida.purama.dev'

function verifyCron(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

function getSvc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'vida_sante' } }
  )
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc = getSvc()
  const stripe = getStripe()
  const windowEnd = new Date()
  const windowStart = new Date(windowEnd.getTime() - WINDOW_DAYS * 86400000)
  const details: Array<Record<string, unknown>> = []

  try {
    // Check A + B — pour chaque facture Stripe payée (fenêtre) : une
    // transaction locale doit exister (stripe_invoice_id), ET les 2
    // pool_transactions (reward+asso) correspondantes doivent exister
    // avec les bons montants (Math.floor(amount*pct/100), pas de reliquat
    // ici — sasu non poolé, cf handleInvoicePaid).
    const stripeInvoices = await stripe.invoices.list({
      status: 'paid',
      created: { gte: Math.floor(windowStart.getTime() / 1000) },
      limit: 100,
    })

    const { data: transactions, error: txErr } = await svc
      .from('transactions')
      .select('stripe_invoice_id, amount_cents')
      .eq('type', 'subscription')
      .gte('created_at', windowStart.toISOString())
    if (txErr) throw txErr

    const { data: poolTxns, error: poolErr } = await svc
      .from('pool_transactions')
      .select('pool_type, amount_cents, reference_id, reason')
      .eq('reason', 'ca_10pct')
      .gte('created_at', windowStart.toISOString())
    if (poolErr) throw poolErr

    let invoicesWithoutTransaction = 0
    let poolSplitMismatches = 0

    for (const invoice of stripeInvoices.data) {
      const amount = invoice.amount_paid ?? 0
      if (amount <= 0) continue

      const tx = (transactions ?? []).find(t => t.stripe_invoice_id === invoice.id)
      if (!tx) {
        invoicesWithoutTransaction++
        details.push({ check: 'invoice_without_transaction', invoice_id: invoice.id, amount_paid_cents: amount })
        continue
      }

      const expectedReward = Math.floor(amount * REWARD_POOL_PERCENTAGE / 100)
      const expectedAsso = Math.floor(amount * ASSO_PERCENTAGE / 100)
      const rewardTx = (poolTxns ?? []).find(p => p.pool_type === 'reward' && p.reference_id === invoice.id)
      const assoTx = (poolTxns ?? []).find(p => p.pool_type === 'asso' && p.reference_id === invoice.id)

      if (!rewardTx || !assoTx || rewardTx.amount_cents !== expectedReward || assoTx.amount_cents !== expectedAsso) {
        poolSplitMismatches++
        details.push({
          check: 'pool_split_mismatch',
          invoice_id: invoice.id,
          expected: { reward: expectedReward, asso: expectedAsso },
          found: { reward: rewardTx?.amount_cents ?? null, asso: assoTx?.amount_cents ?? null },
        })
      }
    }

    // Check C — referrals.status='active' (1er paiement filleul déjà
    // traité) doit avoir une referral_earnings source='first_payment'.
    const { data: activeReferrals, error: refErr } = await svc
      .from('referrals')
      .select('id, referrer_id, first_payment_commission_cents')
      .eq('status', 'active')
    if (refErr) throw refErr

    const { data: earnings, error: earnErr } = await svc
      .from('referral_earnings')
      .select('referral_id, amount_cents, source')
      .eq('source', 'first_payment')
    if (earnErr) throw earnErr

    const referralMismatches = (activeReferrals ?? []).filter(
      r => !(earnings ?? []).some(e => e.referral_id === r.id && e.amount_cents === r.first_payment_commission_cents)
    )
    if (referralMismatches.length > 0) {
      details.push({
        check: 'referral_earning_mismatches',
        count: referralMismatches.length,
        sample: referralMismatches.slice(0, 10),
      })
    }

    // Check D — tranches de prime (J+0/J+30/J+60) en retard : scheduled_for
    // dépassé, jamais payée, jamais clawback. AUCUN cron ne traite les
    // tranches 2/3 dans ce repo (vérifié — seule la tranche 1 est créditée
    // immédiatement au checkout, et encore : `wallets` table absente en
    // live, cf note en tête de fichier) — ce check est donc voué à
    // détecter des retards réels dès qu'un abonnement dépasse 30 jours.
    const { data: overdueTranches, error: primeErr } = await svc
      .from('prime_payouts')
      .select('id, user_id, tranche, amount_cents, scheduled_for')
      .eq('paid', false)
      .eq('clawed_back', false)
      .lt('scheduled_for', windowEnd.toISOString())
    if (primeErr) throw primeErr

    if ((overdueTranches ?? []).length > 0) {
      details.push({
        check: 'overdue_unpaid_tranches',
        count: overdueTranches!.length,
        sample: overdueTranches!.slice(0, 10),
        note: 'Aucun cron ne traite les tranches 2/3 dans ce repo — retard structurel attendu, pas un incident isolé.',
      })
    }

    const hasDrift = details.length > 0
    let alertSent = false

    if (hasDrift) {
      try {
        await resend.emails.send({
          from: FROM,
          to: SUPER_ADMIN_EMAIL,
          subject: `⚠️ VIDA — Réconciliation wallet↔Stripe : ${details.length} anomalie(s) détectée(s)`,
          html: `
            <h1>Réconciliation VIDA — ${windowEnd.toISOString().slice(0, 10)}</h1>
            <p>Fenêtre : ${windowStart.toISOString()} → ${windowEnd.toISOString()}</p>
            <ul>
              <li>Factures Stripe payées sans transaction locale : ${invoicesWithoutTransaction}</li>
              <li>Splits pool reward/asso incohérents : ${poolSplitMismatches}</li>
              <li>Commissions parrain non retrouvées : ${referralMismatches.length}</li>
              <li>Tranches de prime en retard (jamais payées, jamais clawback) : ${(overdueTranches ?? []).length}</li>
            </ul>
            <p>Détail complet dans <code>vida_sante.reconciliation_reports</code>. Aucune correction automatique effectuée — revue humaine requise avant toute action. Pas de check <code>wallet_balance</code>/<code>wallets</code> : code mort / table absente en live, cf ERRORS.md.</p>
          `,
        })
        alertSent = true
      } catch (e) {
        details.push({ check: 'alert_email_failed', error: String(e) })
      }
    }

    await svc.from('reconciliation_reports').insert({
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      invoices_without_transaction: invoicesWithoutTransaction,
      pool_split_mismatches: poolSplitMismatches,
      referral_earning_mismatches: referralMismatches.length,
      overdue_unpaid_tranches: (overdueTranches ?? []).length,
      details,
      alert_sent: alertSent,
    })

    return NextResponse.json({
      ok: true,
      hasDrift,
      alertSent,
      report: {
        invoicesWithoutTransaction,
        poolSplitMismatches,
        referralMismatches: referralMismatches.length,
        overdueUnpaidTranches: (overdueTranches ?? []).length,
      },
    })
  } catch (error) {
    console.error('[cron/reconcile]', error)
    return NextResponse.json(
      { error: 'Erreur réconciliation', details: (error as Error).message },
      { status: 500 }
    )
  }
}
