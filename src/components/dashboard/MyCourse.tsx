import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { CourseEmblem } from '@/components/course/CourseEmblem';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { usePublicCourses, useUnits } from '@/features/courses/queries/useCourses';
import { courseYears, readStudyChoice, saveStudyChoice, type StudyChoice } from '@/entities/auth/studyChoice';
import { unitPath } from '@/entities/course/course.paths';
import { cn } from '@/lib/utils';

const SELECT = 'h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50';

export interface MyCourseOption { slug: string; title: string; code: string | null; duration_semesters: number | null }
export interface MyCourseUnit { id: string; slug: string; title: string; semester: number | null; ects: number | null }

/**
 * First-access guide: the learner names their course (and year, if they want). From then on the dashboard
 * lists that year's curricular units. The choice lives in the learner's own auth metadata, nowhere public.
 */
export function MyCourse({ className }: { className?: string }) {
  const { user } = useAuth();
  const choice = readStudyChoice(user?.user_metadata);
  const courses = usePublicCourses();
  const units = useUnits({ search: '', language: '', page: 1, course: choice?.course, year: choice?.year ?? undefined }, !!choice);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;
  const save = async (next: StudyChoice | null) => {
    setSaving(true); setError(null);
    try { await saveStudyChoice(next); setEditing(false); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };
  return <MyCourseView className={className} courses={courses.data ?? []} choice={choice} editing={editing || !choice}
    units={choice && units.data ? units.data.items : null} unitsTotal={units.data?.total ?? 0} unitsLoading={!!choice && units.isPending}
    saving={saving} error={error} onSave={save} onEdit={() => setEditing(true)} onCancel={choice ? () => setEditing(false) : undefined} />;
}

export function MyCourseView({ className, courses, choice, editing, units, unitsTotal, unitsLoading, saving, error, onSave, onEdit, onCancel }: {
  className?: string; courses: MyCourseOption[]; choice: StudyChoice | null; editing: boolean;
  units: MyCourseUnit[] | null; unitsTotal: number; unitsLoading: boolean; saving: boolean; error: string | null;
  onSave: (choice: StudyChoice | null) => void; onEdit: () => void; onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [draftCourse, setDraftCourse] = useState(choice?.course ?? '');
  const [draftYear, setDraftYear] = useState(choice?.year ? String(choice.year) : '');
  const course = courses.find(item => item.slug === choice?.course);
  const draft = courses.find(item => item.slug === draftCourse);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draftCourse) onSave({ course: draftCourse, year: draftYear ? Number(draftYear) : null });
  };
  const eyebrow = <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
    <span className="h-2.5 w-2.5 border border-foreground bg-brand-cyan" aria-hidden="true" />{t('myCourse.eyebrow')}
  </p>;

  if (editing) return <section aria-labelledby="my-course" className={cn('border border-foreground p-6 sm:p-8', className)}>
    {eyebrow}
    <h2 id="my-course" className="mt-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{t('myCourse.pickTitle')}</h2>
    <p className="mt-2 max-w-prose text-muted-foreground">{t('myCourse.pickText')}</p>
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
      <label className="block space-y-2 text-sm">
        <span className="block font-medium">{t('myCourse.course')}</span>
        <select className={SELECT} value={draftCourse} required disabled={saving}
          onChange={event => { setDraftCourse(event.target.value); setDraftYear(''); }}>
          <option value="">{t('myCourse.coursePlaceholder')}</option>
          {courses.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
        </select>
      </label>
      <label className="block space-y-2 text-sm">
        <span className="block font-medium">{t('myCourse.year')}</span>
        <select className={SELECT} value={draftYear} disabled={saving || !draftCourse} onChange={event => setDraftYear(event.target.value)}>
          <option value="">{t('myCourse.allYears')}</option>
          {courseYears(draft?.duration_semesters).map(year => <option key={year} value={year}>{t('catalog.year', { value: year })}</option>)}
        </select>
      </label>
      <Button type="submit" size="lg" disabled={saving || !draftCourse}>{t('myCourse.save')}</Button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {onCancel
        ? <button type="button" onClick={onCancel} className="font-semibold underline underline-offset-4">{t('common.cancel')}</button>
        : <Link to="/resources" className="font-semibold underline underline-offset-4">{t('myCourse.byTopic')}</Link>}
      {choice && <button type="button" disabled={saving} onClick={() => onSave(null)} className="text-muted-foreground underline underline-offset-4">{t('myCourse.clear')}</button>}
    </p>
  </section>;

  const allHref = `/units?course=${encodeURIComponent(choice?.course ?? '')}${choice?.year ? `&year=${choice.year}` : ''}`;
  return <section aria-labelledby="my-course" className={cn('border border-foreground p-6 sm:p-8', className)}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow}
        <h2 id="my-course" className="mt-3 flex items-start gap-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          {course ? <Link to={`/courses/${encodeURIComponent(course.slug)}`} className="inline-flex min-w-0 items-center gap-3 underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-ring">
            <CourseEmblem course={course} />
            <span className="min-w-0">{course.title}</span>
          </Link> : choice?.course}
        </h2>
        {choice?.year && <p className="mt-1 text-muted-foreground">{t('catalog.year', { value: choice.year })}</p>}
      </div>
      <button type="button" onClick={onEdit} className="min-h-11 text-sm font-semibold underline underline-offset-4">{t('myCourse.change')}</button>
    </div>
    {unitsLoading
      ? <p role="status" className="mt-6 text-sm text-muted-foreground">{t('common.loading')}</p>
      : units?.length
        ? <ul className="mt-6 grid gap-px border border-input bg-input sm:grid-cols-2">
            {units.map(unit => <li key={unit.id} className="bg-background">
              <Link to={unitPath(choice!.course, unit.slug)} className="group flex h-full items-center justify-between gap-3 p-4 hover:bg-muted">
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{unit.title}</span>
                  {unit.semester && <span className="mt-1 block text-sm text-muted-foreground">{t('myCourse.semester', { value: unit.semester })}</span>}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>)}
          </ul>
        : <p className="mt-6 text-sm text-muted-foreground">{t('myCourse.noUnits')}</p>}
    {unitsTotal > (units?.length ?? 0) && <p className="mt-4 text-sm">
      <Link to={allHref} className="font-semibold underline underline-offset-4">{t('myCourse.allUnits', { count: unitsTotal })}</Link>
    </p>}
  </section>;
}
