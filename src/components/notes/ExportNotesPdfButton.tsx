import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { groupNotesByResource, type NoteResource, type StudyNote } from '@/entities/notes/notes';
import { openNotebookPdfPrint, resourcePdfGroups, type NotebookPdfLabels } from '@/entities/notes/notes.pdf';

export function ExportNotesPdfButton({ notes, resource, className }: {
  notes: readonly StudyNote[];
  resource?: NoteResource;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  function exportPdf() {
    if (!notes.length) return;
    const groups = resource ? resourcePdfGroups(resource, notes) : groupNotesByResource([...notes]);
    const labels: NotebookPdfLabels = {
      documentTitle: resource?.title ?? t('notebookPage.title'),
      edition: t('notes.pdfEdition'),
      coverLabel: t('notes.pdfCoverLabel'),
      coverSubtitle: t('notes.pdfCoverSubtitle'),
      contents: t('notes.pdfContents'),
      resource: t('notes.pdfResource'),
      unavailable: t('notes.resourceUnavailable'),
      notesLabel: t('notes.pdfNotes'),
      resourcesLabel: t('notes.pdfResources'),
      pinned: t('notes.pinned'),
      updated: t('notes.pdfUpdated'),
      source: t('notes.exportSource'),
      timestamp: t('notes.pdfMoment'),
      privateNotice: t('notes.pdfPrivate'),
      print: t('notes.pdfPrint'),
      printHint: t('notes.pdfPrintHint'),
      close: t('notes.close'),
      generatedBy: t('notes.pdfGenerated'),
    };
    try {
      const opened = openNotebookPdfPrint(groups, {
        origin: window.location.origin,
        exportedAt: new Date(),
        locale: i18n.language,
        labels,
      });
      if (!opened) toast.error(t('notes.pdfBlocked'), { position: 'bottom-left' });
    } catch {
      toast.error(t('notes.pdfFailed'), { position: 'bottom-left' });
    }
  }
  return <Button type="button" className={className} disabled={!notes.length} onClick={exportPdf}
    title={t('notes.pdfPrintHint')}>
    <FileDown className="h-4 w-4" aria-hidden="true" />
    {t('notes.exportPdf')}
  </Button>;
}
