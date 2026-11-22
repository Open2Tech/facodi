import { formatTimestamp, groupNotesByResource, sortNotes, type NoteGroup, type NoteResource, type StudyNote } from './notes';

/** Local PDF export using the browser's print-to-PDF engine, with no uploads or dependencies. */
export interface NotebookPdfLabels {
  documentTitle: string;
  edition: string;
  coverLabel: string;
  coverSubtitle: string;
  contents: string;
  resource: string;
  unavailable: string;
  notesLabel: string;
  resourcesLabel: string;
  pinned: string;
  updated: string;
  source: string;
  timestamp: string;
  privateNotice: string;
  print: string;
  printHint: string;
  close: string;
  generatedBy: string;
}
export interface NotebookPdfOptions {
  origin: string;
  exportedAt: Date;
  locale: string;
  labels: NotebookPdfLabels;
}
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Everything authored by a student is escaped before controlled markup is added. */
export function escapeNotebookHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ESC[char] ?? char);
}
function inlineNotes(value: string): string {
  const pattern = /(\x60[^\x60\n]+\x60|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  return value.split(pattern).map(part => {
    if (part.startsWith('\x60') && part.endsWith('\x60') && part.length > 2) {
      return '<code>' + escapeNotebookHtml(part.slice(1, -1)) + '</code>';
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return '<strong>' + escapeNotebookHtml(part.slice(2, -2)) + '</strong>';
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return '<em>' + escapeNotebookHtml(part.slice(1, -1)) + '</em>';
    }
    return escapeNotebookHtml(part);
  }).join('');
}
/** Supports the same small, safe Markdown subset written by the notebook editor. */
export function printableNoteBody(body: string): string {
  return body.trim().split(/\x60{3}/).map((part, index) => {
    if (index % 2) {
      const code = part.replace(/^[\w+-]*\n/, '').trim();
      return code ? '<pre><code>' + escapeNotebookHtml(code) + '</code></pre>' : '';
    }
    return part.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
      .map(p => '<p>' + p.split('\n').map(inlineNotes).join('<br>') + '</p>').join('');
  }).join('');
}
function safeSource(path: string | null, origin: string): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[\u0000-\u001f]/.test(path)) return null;
  try {
    const base = new URL(origin);
    if (!['https:', 'http:'].includes(base.protocol)) return null;
    const source = new URL(path, base);
    return source.origin === base.origin ? source.href : null;
  } catch {
    return null;
  }
}
function linkedMoment(group: NoteGroup, note: StudyNote, origin: string): string | null {
  const link = safeSource(group.openHref ?? group.href, origin);
  if (!link) return null;
  const url = new URL(link);
  if (note.timestamp !== null && group.type !== 'course' &&
      group.type !== 'curricular_unit' && group.type !== 'module') {
    url.searchParams.set('t', String(note.timestamp));
  }
  return url.toString();
}
function formattedDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' :
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

/** Colors mirror the site's existing HSL tokens; no theme variables are modified. */
const CSS = String.raw`
@page {
  size: A4;
  margin: 15mm 14mm 18mm;
  @bottom-left { content: "FACODI / CADERNO"; font-size: 8pt; color: hsl(216 56% 18%); letter-spacing: 0.12em; }
  @bottom-right { content: counter(page); font-size: 9pt; color: hsl(216 56% 18%); }
}
:root {
  --ink: hsl(216 56% 18%); --paper: hsl(50 60% 98%); --sun: hsl(64 100% 50%);
  --cyan: hsl(188 63% 52%); --mint: hsl(141 59% 78%); --pink: hsl(337 100% 72%);
  --orange: hsl(36 100% 60%);
}
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: var(--paper); font: 10.5pt/1.55 "Space Grotesk", system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: inherit; overflow-wrap: anywhere; text-decoration-color: var(--cyan); }
.screen-tools { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 13px 22px; background: var(--ink); color: white; font: 13px system-ui, sans-serif; }
.screen-tools .actions { display: flex; gap: 8px; }
.screen-tools button { cursor: pointer; padding: 9px 14px; font: 700 13px system-ui, sans-serif; border: 2px solid var(--sun); background: var(--sun); color: var(--ink); }
.screen-tools #facodi-close { color: white; background: transparent; border-color: white; }
.book { max-width: 210mm; margin: 24px auto; background: white; box-shadow: 0 16px 55px #14284625; }
.cover { position: relative; background: var(--ink); min-height: 250mm; color: white; display: flex; flex-direction: column; padding: 23mm 17mm; overflow: hidden; break-after: page; }
.cover:before { content: ""; position: absolute; top: 42mm; right: -19mm; width: 108mm; height: 108mm; background: var(--sun); transform: rotate(-17deg); }
.cover:after { content: ""; position: absolute; top: 107mm; right: 28mm; width: 39mm; height: 39mm; border: 10mm solid var(--pink); transform: rotate(14deg); }
.brand { position: relative; z-index: 1; font: 800 24pt/1 system-ui, sans-serif; letter-spacing: -.07em; }
.brand b { color: var(--sun); }
.cover-tag { position: relative; z-index: 1; align-self: start; margin-top: 35mm; padding: 2mm 4mm; background: var(--mint); color: var(--ink); text-transform: uppercase; letter-spacing: .12em; font: 800 9pt "IBM Plex Mono", monospace; }
.cover h1 { position: relative; z-index: 1; font-size: 49pt; line-height: 1; letter-spacing: -.065em; margin: 12mm 0 0; max-width: 152mm; overflow-wrap: anywhere; }
.cover h1:after { content: ""; display: block; margin-top: 8mm; width: 26mm; height: 3mm; background: var(--cyan); }
.subtitle { position: relative; z-index: 1; max-width: 126mm; font-size: 13pt; margin-top: 7mm; }
.cover-bottom { position: relative; z-index: 1; display: flex; align-items: end; flex-wrap: wrap; gap: 4mm; margin-top: auto; }
.metric { padding: 5mm; min-width: 41mm; color: var(--ink); background: var(--cyan); }
.metric:nth-child(2) { background: var(--pink); }
.metric strong { display: block; font-size: 26pt; line-height: 1; }
.metric span { font: 8pt "IBM Plex Mono", monospace; text-transform: uppercase; }
.edition { margin-left: auto; font: 9pt "IBM Plex Mono", monospace; }
.contents { break-after: page; padding-bottom: 8mm; }
.content { padding: 14mm 13mm 18mm; }
.kicker { text-transform: uppercase; letter-spacing: .12em; font: 800 9pt "IBM Plex Mono", monospace; margin: 0 0 3mm; }
.contents h2 { font-size: 29pt; letter-spacing: -.045em; line-height: 1.06; margin: 0 0 8mm; }
.contents ol { list-style: none; padding: 0; margin: 0; }
.contents li { display: flex; align-items: flex-start; gap: 4mm; padding: 3.5mm 0; border-bottom: 1px solid var(--ink); break-inside: avoid; }
.contents .no { font: 800 16pt "IBM Plex Mono", monospace; width: 13mm; flex-shrink: 0; }
.contents a { flex: 1; font-weight: 700; text-decoration: none; font-size: 12pt; }
.contents .count { font: 9pt "IBM Plex Mono", monospace; }
.resource { margin: 5mm 0 11mm; }
.resource-head { break-after: avoid; border-top: 4mm solid var(--cyan); border-bottom: 1px solid var(--ink); padding: 4mm 0; margin-bottom: 5mm; display: flex; gap: 5mm; }
.resource:nth-of-type(3n) .resource-head { border-top-color: var(--orange); }
.resource:nth-of-type(3n+1) .resource-head { border-top-color: var(--pink); }
.resource-head .no { font: 800 19pt "IBM Plex Mono", monospace; }
.resource-head .text { flex: 1; min-width: 0; }
.resource-head h2 { font-size: 20pt; line-height: 1.15; letter-spacing: -.04em; margin: 1mm 0 2mm; overflow-wrap: anywhere; }
.resource-head .detail { font: 9pt "IBM Plex Mono", monospace; }
.resource-head .source { display: block; font-size: 8.5pt; margin-top: 2mm; }
.note { background: white; border: 1px solid #cbd5df; padding: 4mm 5mm; margin: 0 0 4mm; break-inside: auto; }
.note-head { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 3mm; break-after: avoid; }
.note-index { padding: 1mm 2mm; background: var(--sun); white-space: nowrap; font: 800 8pt "IBM Plex Mono", monospace; }
.note h3 { flex: 1; min-width: 33mm; font-size: 13pt; line-height: 1.25; margin: 0; overflow-wrap: anywhere; }
.pinned { background: var(--mint); padding: 1mm 2mm; white-space: nowrap; font: 700 8pt "IBM Plex Mono", monospace; }
.meta { display: flex; gap: 2mm 5mm; flex-wrap: wrap; margin: 2mm 0 3mm; font: 8.5pt "IBM Plex Mono", monospace; }
.note-body { overflow-wrap: anywhere; font-size: 10.5pt; }
.note-body p { margin: 2mm 0; }
.note-body code { font: .87em "IBM Plex Mono", monospace; background: #eef2f6; padding: 0 1mm; }
.note-body pre { overflow-wrap: anywhere; white-space: pre-wrap; background: #eef2f6; border-left: 2mm solid var(--cyan); padding: 3mm; margin: 3mm 0; }
.note-body pre code { padding: 0; }
.tags { margin: 3mm 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 2mm; list-style: none; }
.tags li { font: 9pt "IBM Plex Mono", monospace; padding: 1mm 2mm; border: 1px solid var(--ink); background: var(--paper); overflow-wrap: anywhere; }
.book-end { border-top: 2mm solid var(--ink); padding-top: 3mm; margin-top: 13mm; font-size: 9pt; }
@media screen { body { background: #edf0f4; } .content { padding: 14mm 17mm; } }
@media print {
  .screen-tools { display: none !important; }
  .book { margin: 0; box-shadow: none; max-width: none; }
  .cover { min-height: 254mm; margin: 0; padding: 24mm 18mm; }
  .content { padding: 0; }
}
`;

function noteHtml(note: StudyNote, group: NoteGroup, number: number, options: NotebookPdfOptions): string {
  const { labels, locale } = options;
  const updated = formattedDate(note.updatedAt, locale);
  const moment = note.timestamp !== null && group.type !== 'course' && group.type !== 'curricular_unit' && group.type !== 'module'
    ? formatTimestamp(note.timestamp) : null;
  const href = linkedMoment(group, note, options.origin);
  return '<article class="note"><div class="note-head"><span class="note-index">' +
    String(number).padStart(2, '0') + '</span><h3>' + escapeNotebookHtml(note.title) + '</h3>' +
    (note.pinned ? '<span class="pinned">' + escapeNotebookHtml(labels.pinned) + '</span>' : '') + '</div>' +
    '<div class="meta">' + (updated ? '<span>' + escapeNotebookHtml(labels.updated) + ': ' + escapeNotebookHtml(updated) + '</span>' : '') +
    (moment ? '<span>' + escapeNotebookHtml(labels.timestamp) + ': ' +
      (href ? '<a href="' + escapeNotebookHtml(href) + '" rel="noreferrer">' + escapeNotebookHtml(moment) + '</a>' : escapeNotebookHtml(moment)) + '</span>' : '') +
    '</div>' +
    (note.body.trim() ? '<div class="note-body">' + printableNoteBody(note.body) + '</div>' : '') +
    (note.tags.length ? '<ul class="tags">' + note.tags.map(tag => '<li>#' + escapeNotebookHtml(tag) + '</li>').join('') + '</ul>' : '') +
    '</article>';
}

function groupHtml(group: NoteGroup, index: number, options: NotebookPdfOptions): string {
  const { labels } = options;
  const href = safeSource(group.href, options.origin);
  return '<section class="resource" id="resource-' + (index + 1) + '"><header class="resource-head">' +
    '<span class="no">' + String(index + 1).padStart(2, '0') + '</span><div class="text"><p class="kicker">' +
    escapeNotebookHtml(labels.resource) + '</p><h2>' + escapeNotebookHtml(group.title || labels.unavailable) + '</h2>' +
    '<span class="detail">' + group.notes.length + ' ' + escapeNotebookHtml(labels.notesLabel) + '</span>' +
    (href ? '<a class="source" href="' + escapeNotebookHtml(href) + '" rel="noreferrer">' +
       escapeNotebookHtml(labels.source) + ': ' + escapeNotebookHtml(href) + '</a>' : '') +
    '</div></header>' + sortNotes(group.notes).map((note, i) => noteHtml(note, group, i + 1, options)).join('') +
    '</section>';
}

/** A4 print document with an illustrated FACODI cover, contents, notes and live links. */
export function notebookPdfHtml(groups: readonly NoteGroup[], options: NotebookPdfOptions): string {
  const { labels } = options;
  const notes = groups.reduce((sum, group) => sum + group.notes.length, 0);
  const date = formattedDate(options.exportedAt.toISOString(), options.locale);
  const contents = groups.length > 1
    ? '<section class="contents"><p class="kicker">FACODI / INDEX</p><h2>' + escapeNotebookHtml(labels.contents) + '</h2><ol>' +
      groups.map((g, i) => '<li><span class="no">' + String(i + 1).padStart(2, '0') +
        '</span><a href="#resource-' + (i + 1) + '">' + escapeNotebookHtml(g.title || labels.unavailable) +
        '</a><span class="count">' + g.notes.length + '</span></li>').join('') + '</ol></section>' : '';
  return '<!doctype html><html lang="' + escapeNotebookHtml(options.locale) + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">' +
    '<title>' + escapeNotebookHtml(labels.documentTitle) + ' - FACODI</title><style>' + CSS + '</style></head><body>' +
    '<div class="screen-tools"><span>' + escapeNotebookHtml(labels.printHint) + '</span><div class="actions">' +
    '<button type="button" id="facodi-print">' + escapeNotebookHtml(labels.print) + '</button>' +
    '<button type="button" id="facodi-close">' + escapeNotebookHtml(labels.close) + '</button></div></div>' +
    '<main class="book"><section class="cover"><div class="brand">FACODI<b>.</b></div>' +
    '<span class="cover-tag">' + escapeNotebookHtml(labels.coverLabel) + '</span>' +
    '<h1>' + escapeNotebookHtml(labels.documentTitle) + '</h1><p class="subtitle">' +
    escapeNotebookHtml(labels.coverSubtitle) + '</p><div class="cover-bottom">' +
    '<div class="metric"><strong>' + notes + '</strong><span>' + escapeNotebookHtml(labels.notesLabel) + '</span></div>' +
    '<div class="metric"><strong>' + groups.length + '</strong><span>' + escapeNotebookHtml(labels.resourcesLabel) + '</span></div>' +
    '<div class="edition">' + escapeNotebookHtml(labels.edition + ' · ' + date) + '</div></div></section>' +
    '<div class="content">' + contents + groups.map((group, i) => groupHtml(group, i, options)).join('') +
    '<footer class="book-end"><strong>FACODI.</strong> ' + escapeNotebookHtml(labels.privateNotice) + '<br>' +
    escapeNotebookHtml(labels.generatedBy) + '</footer></div></main></body></html>';
}

/** A source-specific print keeps canonical course, UC, module and video links. */
export function resourcePdfGroups(resource: NoteResource, notes: readonly StudyNote[]): NoteGroup[] {
  return groupNotesByResource(notes.filter(note => note.resourceId === resource.id).map(note => ({
    ...note, resourceTitle: resource.title, resourceSlug: resource.slug,
    ...(resource.type ? { resourceType: resource.type } : {}),
    ...(resource.href ? { resourceHref: resource.href } : {}),
  })));
}

/** Open from a real click to avoid popup blockers; all note content stays on-device. */
export function openNotebookPdfPrint(groups: readonly NoteGroup[], options: NotebookPdfOptions): boolean {
  if (!groups.some(group => group.notes.length)) return false;
  const popup = window.open('', '_blank');
  if (!popup) return false;
  popup.document.open();
  popup.document.write(notebookPdfHtml(groups, options));
  popup.document.close();
  popup.document.getElementById('facodi-print')?.addEventListener('click', () => popup.print());
  popup.document.getElementById('facodi-close')?.addEventListener('click', () => popup.close());
  void popup.document.fonts.ready.then(() => {
    if (!popup.closed) { popup.focus(); popup.print(); }
  }).catch(() => { /* Manual print action remains available in the preview. */ });
  return true;
}
