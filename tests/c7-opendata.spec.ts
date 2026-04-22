/**
 * C7 F3 — Tests fallback OpenData DILA avec dump mock local.
 *
 * Crée un tar.gz factice contenant 2 fichiers XML style DILA,
 * puis extract + parse + vérifie que les articles sortent bien.
 * Aucun appel réseau — 100 % offline et reproductible.
 */

import { test, expect } from '@playwright/test'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'
import * as tar from 'tar'
import {
  extractDump,
  parseArticleXml,
  walkExtractedDump,
} from '../src/lib/legifrance/opendata'

const FAKE_ARTICLE_1 = `<?xml version="1.0" encoding="UTF-8"?>
<ARTICLE>
  <META>
    <META_COMMUN>
      <ID>LEGIARTI000006900001</ID>
      <CID>LEGIARTI000006900001</CID>
    </META_COMMUN>
    <META_SPEC>
      <META_ARTICLE>
        <NUM>L1234-5</NUM>
        <ETAT>VIGUEUR</ETAT>
        <DATE_DEBUT>2020-01-01</DATE_DEBUT>
        <DATE_FIN>2999-01-01</DATE_FIN>
        <ORIGINE>Code du travail</ORIGINE>
      </META_ARTICLE>
    </META_SPEC>
  </META>
  <BLOC_TEXTUEL>
    <CONTENU>Le salarié involontairement privé d'emploi a droit à l'allocation chômage sous conditions.</CONTENU>
  </BLOC_TEXTUEL>
</ARTICLE>`

const FAKE_ARTICLE_2 = `<?xml version="1.0" encoding="UTF-8"?>
<ARTICLE>
  <META>
    <META_COMMUN>
      <ID>LEGIARTI000006900002</ID>
      <CID>LEGIARTI000006900002</CID>
    </META_COMMUN>
    <META_SPEC>
      <META_ARTICLE>
        <NUM>L262-1</NUM>
        <ETAT>VIGUEUR</ETAT>
        <DATE_DEBUT>2022-04-01</DATE_DEBUT>
        <ORIGINE>Code de l'action sociale et des familles</ORIGINE>
      </META_ARTICLE>
    </META_SPEC>
  </META>
  <BLOC_TEXTUEL>
    <CONTENU>Toute personne résidant en France de manière stable a droit au revenu de solidarité active.</CONTENU>
  </BLOC_TEXTUEL>
</ARTICLE>`

test.describe('C7 F3 — OpenData DILA fallback', () => {
  let workDir: string
  let mockDumpPath: string

  test.beforeAll(async () => {
    workDir = await fs.mkdtemp(join(tmpdir(), 'legi-test-'))

    // Crée la structure DILA : code/LEGITEXT{id}/article/L/L1/{cid}.xml
    const sourceDir = join(workDir, 'source')
    const articlePath1 = join(sourceDir, 'code', 'LEGITEXT000006072050', 'article', 'L', 'L1', 'LEGIARTI000006900001.xml')
    const articlePath2 = join(sourceDir, 'code', 'LEGITEXT000006074069', 'article', 'L', 'L2', 'LEGIARTI000006900002.xml')
    await fs.mkdir(join(sourceDir, 'code', 'LEGITEXT000006072050', 'article', 'L', 'L1'), { recursive: true })
    await fs.mkdir(join(sourceDir, 'code', 'LEGITEXT000006074069', 'article', 'L', 'L2'), { recursive: true })
    await fs.writeFile(articlePath1, FAKE_ARTICLE_1, 'utf8')
    await fs.writeFile(articlePath2, FAKE_ARTICLE_2, 'utf8')

    // tar + gzip → mock dump
    mockDumpPath = join(workDir, 'mock-dump.tar.gz')
    const tarStream = tar.c({ cwd: sourceDir }, ['code'])
    await pipeline(tarStream, createGzip(), createWriteStream(mockDumpPath))
  })

  test.afterAll(async () => {
    await fs.rm(workDir, { recursive: true, force: true })
  })

  test('parseArticleXml extrait CID, numéro, texte, état', async () => {
    const xmlPath = join(workDir, 'source', 'code', 'LEGITEXT000006072050', 'article', 'L', 'L1', 'LEGIARTI000006900001.xml')
    const article = await parseArticleXml(xmlPath)

    expect(article).not.toBeNull()
    expect(article!.cid).toBe('LEGIARTI000006900001')
    expect(article!.code).toBe('LEGITEXT000006072050')
    expect(article!.numero).toBe('L1234-5')
    expect(article!.etat).toBe('VIGUEUR')
    expect(article!.texte).toContain('allocation chômage')
    expect(article!.date_fin).toBeNull() // 2999-01-01 filtré = null
    expect(article!.url_legifrance).toContain('LEGIARTI000006900001')
  })

  test('extractDump + walkExtractedDump → 2 articles', async () => {
    const extractDir = join(workDir, 'extracted-1')
    await extractDump(mockDumpPath, extractDir)

    const articles = []
    for await (const article of walkExtractedDump(extractDir)) {
      articles.push(article)
    }

    expect(articles).toHaveLength(2)
    const cids = articles.map((a) => a.cid).sort()
    expect(cids).toEqual(['LEGIARTI000006900001', 'LEGIARTI000006900002'])
  })

  test('codeFilter restreint à 1 code (travail) → 1 article', async () => {
    const extractDir = join(workDir, 'extracted-2')
    await extractDump(mockDumpPath, extractDir, ['LEGITEXT000006072050'])

    const articles = []
    for await (const article of walkExtractedDump(extractDir, ['LEGITEXT000006072050'])) {
      articles.push(article)
    }

    expect(articles).toHaveLength(1)
    expect(articles[0].code).toBe('LEGITEXT000006072050')
    expect(articles[0].numero).toBe('L1234-5')
  })
})
