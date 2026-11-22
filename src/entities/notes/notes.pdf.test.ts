import { describe, expect, it, vi } from 'vitest';
import { createNote, groupNotesByResource } from './notes';
import {
  escapeNotebookHtml, notebookPdfHtml, openNotebookPdfPrint, printableNoteBody, resourcePdfGroups,
  type NotebookPdfLabels, type NotebookPdfOptions,
} from './notes.pdf';

const labels: NotebookPdfLabels = {
  documentTitle: 'Caderno de estudo',
  edition: 'Edição pessoal',
  coverLabel: 'O teu campus no papel',
  coverSubtitle: 'Ideias e descobertas.',
  contents: 'Mapa do caderno',
  resource: 'Recurso de estudo',
  unavailable: 'Recurso indisponível',
  notesLabel: 'anotações',
  resourcesLabel: 'recursos',
  pinned: 'Fixada',
  updated: 'Atualizada',
  source: 'Fonte',
  timestamp: 'Momento da aula',
  privateNotice: 'Documento privado.',
  print: 'Guardar como PDF',
  printHint: 'Escolhe Guardar como PDF.',
  close: 'Fechar',
  generatedBy: 'Criado localmente em facodi.com',
};
const options: NotebookPdfOptions = {
  origin: 'https://facodi.com',
  exportedAt: new Date('2026-11-22T12:00:00Z'),
  locale: 'pt-PT',
  labels,
};
const draft = { title: 'Derivadas e integrais', body: 'Usar **cadeia** e ' + String.fromCharCode(96) + 'f(x)' + String.fromCharCode(96), tags: ['exame', 'revisao'], timestamp: 123 };
const video = { id: 'video-1', slug: 'aula-de-calculo', title: 'Álgebra & Cálculo', type: 'video' };
const unit = { id: 'unit-1', slug: 'calculo', title: 'Cálculo I', type: 'curricular_unit', href: '/courses/bioquimica/units/calculo' };
const videoNote = { ...createNote(video, draft, options.exportedAt), id: 'note-1', pinned: true };
const unitNote = { ...createNote(unit, { ...draft, title: 'Conceito da unidade', timestamp: null }, options.exportedAt), id: 'note-2' };

describe('FACODI PDF notebook rendering', () => {
  it('creates a branded, paginated, linked A4 book with cover, contents and resource groups', () => {
    const document = notebookPdfHtml(groupNotesByResource([videoNote, unitNote]), options);
    expect(document).toContain('@page');
    expect(document).toContain('size: A4');
    expect(document).toContain('FACODI');
    expect(document).toContain('hsl(216 56% 18%)');
    expect(document).toContain('hsl(64 100% 50%)');
    expect(document).toContain('Mapa do caderno');
    expect(document).toContain('resource-1');
    expect(document).toContain('resource-2');
    expect(document).toContain('Derivadas e integrais');
    expect(document).toContain('https://facodi.com/resources/aula-de-calculo?notes=open&amp;t=123');
    expect(document).toContain('https://facodi.com/courses/bioquimica/units/calculo?notes=unit');
    expect(document).toContain('02:03');
    expect(document).toContain('Fixada');
    expect(document).toContain('#exame');
    expect(document).toContain('<strong>cadeia</strong>');
    expect(document).toContain('<code>f(x)</code>');
    expect(document).toContain('noindex,nofollow,noarchive');
    expect(document).toContain('Documento privado.');
    expect(document).not.toContain('<script>');
  });

  it('escapes student-authored HTML and print-document attributes without XSS', () => {
    const unsafe = { ...videoNote,
      title: '<img src=x onerror=alert(1)>',
      body: '<script>alert("x")</script>\n\n' + String.fromCharCode(96, 96, 96) + 'js\nconst x = "<iframe>";\n' + String.fromCharCode(96, 96, 96),
      tags: ['"><script>'], resourceTitle: '<svg/onload=alert(1)>',
    };
    const document = notebookPdfHtml(groupNotesByResource([unsafe]), {
      ...options, labels: { ...labels, documentTitle: '<b>Oi</b>' },
    });
    expect(escapeNotebookHtml('<"&>')).toBe('&lt;&quot;&amp;&gt;');
    expect(document).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(document).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(document).toContain('&lt;iframe&gt;');
    expect(document).toContain('&lt;b&gt;Oi&lt;/b&gt;');
    expect(document).not.toContain('<iframe>');
    expect(document).not.toContain('<script>');
    expect(document).not.toContain('<svg/onload');
  });

  it('produces readable formatting for multi-paragraph notes and long code blocks', () => {
    const backticks = String.fromCharCode(96, 96, 96);
    const rendered = printableNoteBody('Primeira linha\nsegunda linha\n\n**Negrito** *itálico*' +
      '\n\n' + backticks + 'python\nprint("<p>")\n' + backticks);
    expect(rendered).toContain('Primeira linha<br>segunda linha');
    expect(rendered).toContain('<strong>Negrito</strong> <em>itálico</em>');
    expect(rendered).toContain('<pre><code>print(&quot;&lt;p&gt;&quot;)</code></pre>');
    expect(rendered).not.toContain('<p>")');
  });

  it('does not invent links to unpublished resources or incorrectly time-stamp UC notes', () => {
    const unavailable = { ...unitNote, resourceHref: undefined, resourceType: 'curricular_unit' };
    const page = notebookPdfHtml(groupNotesByResource([unavailable]), options);
    expect(page).toContain('Cálculo I');
    expect(page).not.toContain('https://facodi.com/resources/calculo');
    expect(page).not.toContain('https://facodi.com/courses/bioquimica/units/calculo');
    const timed = { ...unitNote, timestamp: 100 };
    const page2 = notebookPdfHtml(groupNotesByResource([timed]), options);
    expect(page2).toContain('https://facodi.com/courses/bioquimica/units/calculo');
    expect(page2).not.toContain('?t=100');
  });

  it('prints one resource only and keeps the original note objects untouched', () => {
    const result = resourcePdfGroups(unit, [videoNote, unitNote]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Cálculo I');
    expect(result[0].notes.map(note => note.id)).toEqual(['note-2']);
    expect(result[0].href).toBe('/courses/bioquimica/units/calculo');
    expect(unitNote.resourceHref).toBe('/courses/bioquimica/units/calculo');
  });

  it('does not open a print window for an empty notebook or when the popup is blocked', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    expect(openNotebookPdfPrint([], options)).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(openNotebookPdfPrint(groupNotesByResource([videoNote]), options)).toBe(false);
    expect(open).toHaveBeenCalledOnce();
    open.mockRestore();
  });
});
