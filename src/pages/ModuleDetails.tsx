import { ArrowLeft, ArrowRight, BookOpenCheck, ChevronRight, ClipboardList, Link2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModule } from '@/features/modules/useModules';
import { moduleResourcePath, type StudyModuleDetail } from '@/entities/module/module.api';
import { unitPath } from '@/entities/course/course.paths';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { PageState } from '@/components/layout/PageState';
import { PageSeo, NoIndex } from '@/components/layout/PageSeo';
import { ShareButton } from '@/components/share/ShareButton';
import { resourceMeta } from '@/shared/seo/seo';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { plainText } from '@/shared/lib/text';

const GROUPS = ['module','topic','playlist','video','document','external_resource'] as const;
type LearningItem = StudyModuleDetail['items'][number];

function metaText(metadata: StudyModuleDetail['module']['metadata'], key: string) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export default function ModuleDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useModule(slug);

  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <><NoIndex /><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /></>;

  const { module, units, items } = query.data;
  const activity = metaText(module.metadata,'activity_prompt');
  const deliverable = metaText(module.metadata,'suggested_deliverable');
  const selfReview = metaText(module.metadata,'self_review_criteria');
  const grouped = GROUPS.map(type => ({
    type, items: items.filter(item => item.object_type === type),
  })).filter(group => group.items.length > 0);
  const known = new Set<string>(GROUPS);
  const other = items.filter(item => !known.has(item.object_type));
  if (other.length) grouped.push({ type: 'external_resource', items: other });

  return <article>
    <PageSeo {...resourceMeta({ ...module, object_type: 'module' }, null, { resources: t('nav.resources'), type: t('objectTypes.module') })} />
    <nav aria-label={t('unit.breadcrumb')} className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
        <li><Link to="/resources?type=module" className="inline-flex items-center gap-1 underline underline-offset-4">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('studyModules.title')}
        </Link></li>
        <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
        <li aria-current="page" className="line-clamp-1 text-foreground">{module.title}</li>
      </ol>
    </nav>
    <header className="border-b border-foreground border-t-4 border-t-brand-mint pb-9 pt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 border border-foreground bg-brand-mint px-3 py-1.5 text-xs font-semibold uppercase text-brand-ink">
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />{t('objectTypes.module')}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{t('studyModules.resourceCount',{count:items.length})}</span>
      </div>
      <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{module.title}</h1>
      {module.description && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
        {plainText(module.description)}
      </p>}
      <div className="mt-6"><ShareButton title={module.title} /></div>
    </header>
    <LearningContext focus="module" />
    {!!units.length && <section aria-labelledby="module-curricular-context" className="border-y border-input py-7">
      <h2 id="module-curricular-context" className="text-lg font-semibold">{t('studyModules.linkedUnits')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('studyModules.linkedUnitsDescription')}</p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {units.map(unit => <li key={unit.id}>
          <Link to={unitPath(unit.courses.slug,unit.slug)} className="inline-flex items-center gap-2 border border-foreground bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-orange hover:text-brand-ink">
            {unit.title}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
    </section>}
    {(activity || deliverable || selfReview) && <section aria-labelledby="module-practice" className="mt-10 border border-foreground border-t-4 border-t-primary bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-foreground bg-primary text-brand-ink" aria-hidden="true">
          <ClipboardList className="h-5 w-5" />
        </span>
        <h2 id="module-practice" className="text-2xl font-semibold">{t('studyModules.practice')}</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{t('studyModules.practiceNotice')}</p>
      <dl className="mt-6 space-y-5">
        {activity && <div><dt className="text-sm font-semibold">{t('studyModules.activity')}</dt><dd className="mt-1 whitespace-pre-wrap leading-relaxed">{activity}</dd></div>}
        {deliverable && <div><dt className="text-sm font-semibold">{t('studyModules.deliverable')}</dt><dd className="mt-1 leading-relaxed">{deliverable}</dd></div>}
        {selfReview && <div><dt className="text-sm font-semibold">{t('studyModules.selfReview')}</dt><dd className="mt-1 leading-relaxed">{selfReview}</dd></div>}
      </dl>
    </section>}
    <section aria-labelledby="module-materials" className="mt-12">
      <h2 id="module-materials" className="text-3xl font-semibold tracking-tight">{t('studyModules.materials')}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('studyModules.materialsDescription')}</p>
      {grouped.length ? <div className="mt-9 space-y-9">
        {grouped.map(group => <section key={group.type} aria-label={t(`objectTypes.${group.type}`,{defaultValue:group.type})}>
          <h3 className="mb-4 text-lg font-semibold">{t(`studyModules.groupTitles.${group.type}`,{defaultValue:t(`objectTypes.${group.type}`,{defaultValue:group.type})})}
            <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">({group.items.length})</span>
          </h3>
          <ol className="divide-y divide-input border-y border-input">
            {group.items.map((item: LearningItem) => <li key={item.id}>
              <Link className="group flex items-start justify-between gap-4 py-4 hover:bg-muted/40"
                to={moduleResourcePath(item.object_type,item.slug)}>
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                  {item.description && <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">{plainText(item.description)}</span>}
                  <TypeBadge type={item.object_type}
                    label={t(`objectTypes.${item.object_type}`,{defaultValue:item.object_type})}
                    className="mt-2" />
                </span>
                <Link2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>)}
          </ol>
        </section>)}
      </div> : <PageState level="h3" title={t('studyModules.noMaterials')} description={t('studyModules.noMaterialsText')} />}
    </section>
    <p className="mt-12 max-w-4xl border-t border-input pt-6 text-sm leading-relaxed text-muted-foreground">
      {t('studyModules.disclaimer')}
    </p>
  </article>;
}
