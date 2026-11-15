import { LegalDocument } from '@/components/legal/LegalDocument';
import type { LegalDocumentId } from '@/components/legal/legalDocuments';

export default function LegalPage({ document }: { document: LegalDocumentId }) {
  return <LegalDocument key={document} id={document} />;
}
