import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, BookOpen, Boxes, BriefcaseBusiness, Cable, ChartNoAxesCombined, Cpu, Dumbbell, FlaskConical, GraduationCap, Landmark, Languages, Megaphone, MousePointerClick, PenTool, type LucideIcon } from 'lucide-react';
import type { Course } from '@/entities/course/course.types';
import './CourseEmblem.css';

type Subject = 'accounting' | 'computing' | 'psychology' | 'neuroscience' | 'astronomy' | 'mathematics' | 'civil';
type Identity = Pick<Course, 'slug' | 'title'>;

const subjects = new Map<string, Subject | LucideIcon>([
  ['ctesp-contabilidade', 'accounting'],
  ['ctesp-desenho-modelacao-digital', Boxes],
  ['ctesp-marketing-digital', MousePointerClick],
  ['ctesp-sti', Cable],
  ['astronomia-astrofisica-gacs-2018', 'astronomy'],
  ['bioquimica', FlaskConical],
  ['ciencias-biomedicas', Activity],
  ['ciencias-educacao-formacao', GraduationCap],
  ['ldcom', PenTool],
  ['desporto', Dumbbell],
  ['economia', ChartNoAxesCombined],
  ['engenharia-civil', 'civil'],
  ['lesti', 'computing'],
  ['engenharia-eletrotecnica-computadores', Cpu],
  ['gestao', BriefcaseBusiness],
  ['ufes-letras-ingles', Languages],
  ['marketing', Megaphone],
  ['matematica-aplicada-economia-gestao', 'mathematics'],
  ['patrimonio-cultural-arqueologia', Landmark],
  ['psicologia', 'psychology'],
  ['neurociencias-cognitivas-neuropsicologia', 'neuroscience'],
  ['ifes-cariacica-administracao-integrado-2026', BriefcaseBusiness],
]);

function Illustration({ subject, large = false, greeting }: { subject: Subject; large?: boolean; greeting?: string }) {
  return <svg viewBox="0 0 32 32" width={large ? 48 : 26} height={large ? 48 : 26} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {subject === 'mathematics' && <>
      <rect x="4" y="8" width="24" height="15" />
      <path d="M19 8v15m0-6h9m-6 0v6m-3-3h3" strokeWidth="1" />
      <path className="emblem-reveal-line" pathLength="1" d="M4 23a15 15 0 0 1 15-15 9 9 0 0 1 9 9 6 6 0 0 1-6 6 3 3 0 0 1-3-3 3 3 0 0 1 3-3" />
    </>}
    {subject === 'civil' && <>
      <path d="M2 23h28M4 23v4m24-4v4M4 21V10h24v11M12 10v13m8-13v13" />
      <path className="emblem-reveal-line" pathLength="1" d="m4 23 8-13 8 13 8-13" />
    </>}
    {subject === 'accounting' && <>
      <path d="M3 6q7-2 13 1 6-3 13-1v20q-7-2-13 1-6-3-13-1zM16 7v20M6 11h7m6 0h7" />
      <path className="emblem-ledger-lines" d="M6 15h6m8 0h6M6 19h4m10 0h4" />
      {large && <g className="emblem-entry" fill="currentColor" stroke="none" fontSize="6" textAnchor="middle"><text x="9.5" y="20">10</text><text x="22.5" y="20">10</text></g>}
    </>}
    {subject === 'computing' && <>
      <rect x="2" y="5" width="28" height="22" rx="2" /><path d="M2 11h28M6 8h1m3 0h1M6 16l3 3-3 3" />
      <path className="emblem-cursor" d="M12 22h5" />
      {large && <text className="emblem-entry" x="11" y="21" textLength="16" lengthAdjust="spacingAndGlyphs" fontSize="5" fill="currentColor" stroke="none">{greeting}</text>}
    </>}
    {subject === 'psychology' && <><rect x="2" y="2" width="28" height="28" rx="3" fill="currentColor" /><path className="emblem-vase" stroke="none" d="M8 5h16q-3 2-3 5l2 4-2 1v2l-1 1v2q-1 2-3 2v2l4 3H11l4-3v-2q-2 0-3-2v-2l-1-1v-2l-2-1 2-4q0-3-3-5Z" /></>}
    {subject === 'neuroscience' && <>
      <path d="m2 7 4 3-4 5m4-5 3-6m-3 6 6 4 3 1m-3-1 2-3m8 10 5 4 3-2m-3 2 2 5m-7-9-3-6m3 6-5-2m5 2-1 5" />
      <circle cx="7" cy="10" r="2" fill="currentColor" /><circle cx="22" cy="21" r="2" fill="currentColor" /><circle className="emblem-signal" cx="14" cy="14" r="1.6" fill="currentColor" />
    </>}
    {subject === 'astronomy' && <>
      <circle className="emblem-star" cx="16" cy="16" r="8" fill="currentColor" /><path d="M16 2v2m0 24v2M2 16h2m24 0h2M6 6l2 2m16 16 2 2M6 26l2-2M24 8l2-2" />
      <circle className="emblem-planet" cx="11" cy="17" r="3" />
    </>}
  </svg>;
}

export function CourseEmblem({ course, detail = false }: { course: Identity; detail?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const captionId = useId();
  const SubjectIcon = subjects.get(course.slug) ?? BookOpen;
  const tile = 'inline-grid shrink-0 place-items-center border border-foreground bg-primary text-brand-ink';
  const size = detail ? ' h-16 w-16' : ' h-12 w-12';
  if (!detail || typeof SubjectIcon !== 'string') {
    return <span aria-hidden="true" className={tile + size}>{typeof SubjectIcon === 'string' ? <Illustration subject={SubjectIcon} large={detail} /> : <SubjectIcon size={detail ? 36 : 24} strokeWidth={1.75} />}</span>;
  }
  return <div className="flex items-center gap-4">
    <button type="button" aria-label={t('course.emblem.discover', { course: course.title })} aria-expanded={open} aria-controls={captionId}
      onClick={() => setOpen(!open)} className={tile + size + ' course-emblem focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'}>
      <Illustration subject={SubjectIcon} large greeting={t('course.emblem.greeting')} />
    </button>
    <p id={captionId} hidden={!open} className="max-w-prose text-sm">{t('course.emblem.' + SubjectIcon)}</p>
  </div>;
}
