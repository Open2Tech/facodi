export const LEGAL_DOCUMENTS = ['privacy', 'terms', 'cookies', 'copyright', 'accessibility', 'legal'] as const;

export type LegalDocumentId = typeof LEGAL_DOCUMENTS[number];

/** Date of the last substantive review of the legal texts (ISO 8601). */
export const LEGAL_LAST_UPDATED = '2026-11-15';

export const legalPath = (id: LegalDocumentId) => `/${id}`;

export interface LegalFact { label: string; value: string; pending?: boolean }

export interface LegalSection {
  id: string;
  title: string;
  body?: string[];
  items?: string[];
  /** `code` renders the first column (storage keys, hosts) in monospace. */
  table?: { caption: string; columns: string[]; rows: string[][]; code?: boolean };
  facts?: LegalFact[];
}

export interface LegalDocumentContent {
  title: string;
  description: string;
  lead: string;
  summary?: string[];
  sections: LegalSection[];
}
