import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import BottomTabBar from '@/components/layout/BottomTabBar'
import SpiritualLayer, { WisdomFooter } from '@/components/shared/SpiritualLayer'
import LegalGateMount from '@/components/shared/LegalGateMount'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { computeDocsEnAttente, CURRENT_LEGAL_VERSIONS, type LegalDocType } from '@/lib/legal'

// Seuls cgu/cgv/confidentialite sont réellement collectés (signup + callback OAuth,
// cf recordLegalAcceptance) — "mentions" n'est qu'informatif (pas de case à cocher nulle
// part) et ne doit jamais déclencher le gate, sinon il boucle indéfiniment pour tout le
// monde (piège CLAUDE.md §13.3 "questionnaire qui boucle").
const DOCS_SOUMIS_A_ACCEPTATION: LegalDocType[] = ['cgu', 'cgv', 'confidentialite']

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let docsEnAttente: LegalDocType[] = []
  if (user) {
    const { data: acceptances } = await supabase
      .from('legal_acceptances')
      .select('doc_type, version')
      .eq('user_id', user.id)
    const dernieresAcceptations = Object.fromEntries(
      (acceptances ?? []).map((a) => [a.doc_type, a.version])
    ) as Partial<Record<LegalDocType, string>>
    const currentVersions = Object.fromEntries(
      DOCS_SOUMIS_A_ACCEPTATION.map((doc) => [doc, CURRENT_LEGAL_VERSIONS[doc]])
    ) as Record<LegalDocType, string>
    docsEnAttente = computeDocsEnAttente(dernieresAcceptations, currentVersions)
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] p-4 pb-20 lg:p-8 lg:pb-8">
          {children}
        </main>
        <WisdomFooter />
      </div>
      <BottomTabBar />
      <SpiritualLayer />
      {docsEnAttente.length > 0 && <LegalGateMount docsEnAttente={docsEnAttente} />}
    </div>
  )
}
