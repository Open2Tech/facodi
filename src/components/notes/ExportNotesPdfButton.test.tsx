import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import { createNote } from '@/entities/notes/notes';
import i18n from '@/i18n/config';
import { ExportNotesPdfButton } from './ExportNotesPdfButton';

const printPdf = vi.hoisted(() => vi.fn(() => true));
vi.mock('@/entities/notes/notes.pdf', async (getActual) => {
  const original = await getActual<typeof import('@/entities/notes/notes.pdf')>();
  return { ...original, openNotebookPdfPrint: printPdf };
});

const resource = {
  id: 'u1', slug: 'calculo-1', title: 'Cálculo I', type: 'curricular_unit',
  href: '/courses/bioquimica/units/calculo-1',
};
const note = createNote(resource, {
  title: 'Derivadas', body: 'Conceitos básicos', tags: ['revisao'], timestamp: null,
}, new Date('2026-11-22T12:00:00Z'));

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  printPdf.mockClear();
});

describe('ExportNotesPdfButton', () => {
  it('opens a print-ready PDF for one resource without overwriting the original notes', async () => {
    renderWithProviders(<ExportNotesPdfButton resource={resource} notes={[note]} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Exportar PDF (A4)' }));
    expect(printPdf).toHaveBeenCalledOnce();
    const [groups, options] = printPdf.mock.calls[0] as unknown as [
      { resourceId: string; href: string; notes: typeof note[] }[],
      { labels: { documentTitle: string; coverLabel: string }; locale: string },
    ];
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ resourceId: 'u1', href: '/courses/bioquimica/units/calculo-1' });
    expect(groups[0].notes[0].id).toBe(note.id);
    expect(options.labels.documentTitle).toBe('Cálculo I');
    expect(options.labels.coverLabel).toBe('O teu caderno, do teu jeito');
  });

  it('offers the full notebook export independently of Markdown and disables empty exports', async () => {
    const { unmount } = renderWithProviders(<ExportNotesPdfButton notes={[]} />);
    expect(screen.getByRole('button', { name: 'Exportar PDF (A4)' })).toBeDisabled();
    unmount();
    renderWithProviders(<ExportNotesPdfButton notes={[note]} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Exportar PDF (A4)' }));
    expect(printPdf).toHaveBeenCalledOnce();
    const [, options] = printPdf.mock.calls[0] as unknown as [unknown, { labels: { documentTitle: string } }];
    expect(options.labels.documentTitle).toBe('Caderno de estudo');
  });
});
