import { jsPDF } from 'jspdf'
import type { SituationTag, Aide } from './utils'
import { formatMontant } from './utils'

export function generatePDF(
  aides: Aide[],
  situation: SituationTag[],
  cumul: number,
  simulationOk: boolean,
  onComplete: () => void
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = margin

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, pageW, 80, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('VIDA — Dossier de financement', margin, 50)

  y = 120
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, y)
  y += 20
  doc.text(`Situation : ${situation.join(', ')}`, margin, y)
  y += 20
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`Cumul estimé : jusqu'à ${cumul.toLocaleString('fr-FR')} € par an`, margin, y)
  y += 18
  if (simulationOk) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(16, 185, 129)
    doc.text('Montants calculés via OpenFisca — api.openfisca.fr', margin, y)
    y += 14
  }
  y += 6

  doc.setDrawColor(16, 185, 129)
  doc.line(margin, y, pageW - margin, y)
  y += 20

  aides.forEach((a, i) => {
    if (y > 700) { doc.addPage(); y = margin }
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`${i + 1}. ${a.nom}`, margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    const sourceLabel = a.source_montant === 'openfisca' ? ' [OpenFisca]' : ''
    doc.text(`Organisme : ${a.organisme}  ·  ${formatMontant(a)}${sourceLabel}`, margin, y)
    y += 14
    const desc = doc.splitTextToSize(a.description, pageW - margin * 2)
    doc.text(desc, margin, y)
    y += desc.length * 12 + 4

    // Refs Legifrance dans le PDF
    const refs = a.legifrance_refs ?? []
    if (refs.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text('Base légale :', margin, y)
      y += 11
      refs.forEach(ref => {
        if (y > 780) { doc.addPage(); y = margin }
        const refLines = doc.splitTextToSize(`  · ${ref}`, pageW - margin * 2 - 10)
        doc.text(refLines, margin, y)
        y += refLines.length * 10
      })
      y += 4
      doc.setFontSize(10)
    }

    doc.setTextColor(16, 185, 129)
    doc.textWithLink('→ Faire la demande officielle', margin, y, { url: a.url_officielle })
    y += 22
  })

  if (y > 700) { doc.addPage(); y = margin }
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.text('Ces montants sont estimatifs et soumis à conditions. VIDA n\'est pas un organisme social.', margin, y + 20)
  doc.text('Vérifie ton éligibilité sur chaque site officiel. SASU PURAMA · Frasne (25560).', margin, y + 34)

  doc.save(`VIDA-financement-${new Date().toISOString().slice(0, 10)}.pdf`)
  onComplete()
}
