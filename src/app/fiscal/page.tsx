import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiscalité — VIDA',
  description: "Informations fiscales sur les gains perçus via VIDA (seuil 3 000 €, case 5NG, abattement 34%).",
}

export default function FiscalPage() {
  return (
    <main className="relative z-10 min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            ← Retour
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">Fiscalité</h1>
          <p className="text-white/60 text-sm">
            Ce que tu dois savoir sur les gains perçus via VIDA.
          </p>
        </header>

        <section className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold">Seuils de déclaration</h2>
          <p className="text-sm text-white/80">
            En France, les revenus perçus via des plateformes numériques sont à déclarer à
            partir de <strong>3 000 € cumulés par an</strong>.
          </p>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• En dessous de 3 000 € : aucune obligation de déclaration.</li>
            <li>• Au-dessus : tu dois déclarer via impots.gouv.fr.</li>
            <li>• VIDA t&apos;envoie automatiquement des notifications aux paliers 1 500 €, 2 500 € et 3 000 €.</li>
          </ul>
        </section>

        <section className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold">Comment déclarer (3 étapes)</h2>
          <ol className="text-sm text-white/80 space-y-2 list-decimal list-inside">
            <li>Aller sur <a href="https://impots.gouv.fr" target="_blank" rel="noopener" className="underline">impots.gouv.fr</a></li>
            <li>Remplir la <strong>case 5NG</strong> (BIC micro-entrepreneur / revenus non-professionnels)</li>
            <li>Reporter le montant total figurant sur ton récapitulatif annuel VIDA</li>
          </ol>
        </section>

        <section className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold">Abattement forfaitaire 34%</h2>
          <p className="text-sm text-white/80">
            L&apos;administration applique automatiquement un <strong>abattement de 34%</strong>
            sur tes revenus plateformes. Exemple : 5 000 € déclarés → 3 300 € imposables.
          </p>
        </section>

        <section className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold">Récapitulatif annuel</h2>
          <p className="text-sm text-white/80">
            Chaque 1<sup>er</sup> janvier, VIDA te génère un récapitulatif PDF détaillé
            (primes, parrainage, Nature Rewards, marketplace, missions) envoyé par email
            et disponible dans ton espace.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-block mt-2 text-sm text-[var(--color-accent)] hover:underline"
          >
            Télécharger mon récapitulatif →
          </Link>
        </section>

        <section className="text-xs text-white/40 space-y-2">
          <p>
            VIDA et PURAMA ne sauraient être tenus responsables des obligations fiscales
            individuelles de leurs utilisateurs. Consulte un conseiller fiscal pour ta
            situation personnelle.
          </p>
          <p>
            Pour les utilisateurs dépassant 3 000 € / an, une déclaration DAS2 est émise
            automatiquement par PURAMA auprès de l&apos;administration fiscale.
          </p>
        </section>
      </div>
    </main>
  )
}
