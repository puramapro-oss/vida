export function InfoSection() {
  return (
    <section className="glass-card rounded-2xl p-5 text-sm text-[var(--text-secondary)] space-y-2">
      <p className="flex items-start gap-2">
        <span className="text-[var(--emerald)] shrink-0">◆</span>
        <span>CRON hebdomadaire — dimanche 3h UTC — sync les 3 codes en ordre. Idempotent, reprise possible.</span>
      </p>
      <p className="flex items-start gap-2">
        <span className="text-amber-400 shrink-0">◆</span>
        <span>
          Cache 5 tiers : Upstash 30j → Postgres FTS français → Pinecone semantic → PISTE live → static bundled.
        </span>
      </p>
      <p className="flex items-start gap-2">
        <span className="text-sky-400 shrink-0">◆</span>
        <span>
          Kill switch : <code className="bg-white/5 px-1.5 py-0.5 rounded">LEGIFRANCE_DYNAMIC=false</code> force le
          fallback LAW_CONTEXT (12 articles) dans /api/chat.
        </span>
      </p>
    </section>
  )
}
