import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';
import pt from '@/i18n/locales/pt.json';
import { LEGAL_DOCUMENTS, type LegalDocumentContent } from './legalDocuments';

const locales = { pt, en, es, fr };
const INTERNAL_LINK = /\]\((\/[a-z-]+)(?:#([a-z-]+))?\)/g;

function shape(doc: LegalDocumentContent) {
  return {
    summary: doc.summary?.length ?? 0,
    sections: doc.sections.map(section => ({
      id: section.id,
      body: section.body?.length ?? 0,
      items: section.items?.length ?? 0,
      rows: section.table?.rows.map(row => row.length) ?? [],
      facts: section.facts?.map(fact => Boolean(fact.pending)) ?? [],
    })),
  };
}

describe('legal documents', () => {
  it('have the same structure in every locale', () => {
    for (const id of LEGAL_DOCUMENTS) {
      const reference = shape(pt.legal[id] as LegalDocumentContent);
      for (const [locale, messages] of Object.entries(locales)) {
        expect(shape(messages.legal[id] as LegalDocumentContent), `${locale}.${id}`).toEqual(reference);
      }
    }
  });

  it('identifies the personal project accurately without leaking infrastructure identifiers', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      const legal = messages.legal;
      const facts = legal.legal.sections[0].facts ?? [];
      expect(facts.find(fact => fact.value === 'Marcelo Santos'), locale).toBeDefined();
      expect(JSON.stringify(facts), locale).toContain('https://github.com/marcelo-m7');
      expect(JSON.stringify(facts), locale).toContain('https://www.linkedin.com/in/marcelo-m7/');
      const publicCopy = JSON.stringify(legal);
      expect(publicCopy, locale).not.toMatch(/Open 2 Technology|Open2 \\/ O2T|us-east-2|wvkjainfwsyiyfcmbtid/);
      expect(legal.cookies.sections.find(section => section.id === 'manage')?.items).toHaveLength(4);
    }
  });

  it('only link to existing legal sections or known routes', () => {
    const anchors = new Map(LEGAL_DOCUMENTS.map(id => [`/${id}`, new Set((pt.legal[id] as LegalDocumentContent).sections.map(s => s.id))]));
    for (const [locale, messages] of Object.entries(locales)) {
      const text = JSON.stringify(messages);
      for (const [, path, hash] of text.matchAll(INTERNAL_LINK)) {
        if (!anchors.has(path)) continue;
        if (hash) expect(anchors.get(path)?.has(hash), `${locale}: ${path}#${hash}`).toBe(true);
      }
    }
  });
});
