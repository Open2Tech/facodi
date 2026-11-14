import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { Content, ContentKind } from '@/entities/course/course.types';
import type { SaveContent } from '@/entities/course/course.api';
import { useContentOptions } from '@/features/courses/queries/useCourses';
import { contentSchema, type ContentFormValues } from '@/shared/lib/validation';
import { FormField } from '@/components/auth/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';

function RelationPicker({ kind, value, onChange, label, error }: {
  kind: ContentKind; value: string; onChange: (value: string) => void; label: string; error?: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const query = useContentOptions(kind, search, true);
  return <div className="space-y-3">
    <FormField label={t('editor.findRelation', { name: label })}>{props => <Input {...props} type="search" value={search} onChange={event => setSearch(event.target.value)} />}</FormField>
    <FormField label={label} error={error}>{props => <select {...props} className="h-11 w-full rounded-md border border-input bg-background px-3" value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{t('editor.noRelation')}</option>
      {value && !query.data?.some(item => item.id === value) && <option value={value}>{value}</option>}
      {query.data?.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
    </select>}</FormField>
    <p className="text-xs text-muted-foreground">{t('editor.relationLimit')}</p>
    {query.isPending && <p role="status" className="text-sm">{t('common.loading')}</p>}
    {query.error && <div role="alert" className="text-sm text-destructive">{query.error.message}<Button type="button" variant="outline" className="ml-3" onClick={() => void query.refetch()}>{t('common.retry')}</Button></div>}
  </div>;
}

export function ContentForm({ kind, content, saving, onSave, onCancel, error }: {
  kind: ContentKind; content?: Content; saving: boolean; onSave: (input: SaveContent) => Promise<void>; onCancel: () => void; error?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema.refine(values => kind !== 'curricular_units' || !!values.course_id, {
      message: 'validation.required', path: ['course_id'],
    })),
    defaultValues: {
      title: content?.title ?? '', slug: content?.slug ?? '', language: content?.language ?? 'pt',
      description: content ? 'description_html' in content ? content.description_html ?? '' : content.description ?? '' : '',
      summary: content && 'summary' in content ? content.summary ?? '' : '',
      source_url: content?.source_url ?? '',
      course_id: content && 'course_id' in content ? content.course_id : '',
      learning_object_id: content && 'learning_object_id' in content ? content.learning_object_id ?? '' : '',
      object_type: content && 'object_type' in content ? content.object_type : kind === 'learning_objects' ? '' : 'course',
    },
  });
  return <form className="mt-8 max-w-3xl space-y-6 border-t border-input pt-8" noValidate onSubmit={form.handleSubmit(async values => {
    const common = { title: values.title, slug: values.slug, language: values.language, source_url: values.source_url || null };
    if (kind === 'learning_objects') {
      await onSave({ kind, id: content?.id, values: { ...common, object_type: values.object_type, description: values.description || null, ...(!content ? { created_by: user?.id } : {}) } });
    } else {
      const academic = { ...common, summary: values.summary || null, description_html: values.description || null, learning_object_id: values.learning_object_id || null };
      await onSave(kind === 'courses'
        ? { kind, id: content?.id, values: academic }
        : { kind, id: content?.id, values: { ...academic, course_id: values.course_id } });
    }
  })}>
    <h2 className="text-2xl font-semibold">{t(content ? 'editor.editContent' : 'editor.newContent')}</h2>
    {!content && <p className="text-sm text-muted-foreground">{t('editor.manualDraft')}</p>}
    {kind === 'curricular_units' && <p className="rounded-md border border-input bg-muted p-4 text-sm">{t('editor.unitVisibility')}</p>}
    <FormField label={t('editor.title')} error={form.formState.errors.title?.message}>{props => <Input {...props} {...form.register('title')} />}</FormField>
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label={t('editor.slug')} error={form.formState.errors.slug?.message}>{props => <Input {...props} {...form.register('slug')} autoCapitalize="none" spellCheck={false} />}</FormField>
      <FormField label={t('editor.languageCode')} error={form.formState.errors.language?.message}>{props => <Input {...props} {...form.register('language')} />}</FormField>
    </div>
    {kind === 'learning_objects'
      ? <FormField label={t('editor.objectType')} error={form.formState.errors.object_type?.message}>{props => <Input {...props} {...form.register('object_type')} />}</FormField>
      : <FormField label={t('editor.summary')} error={form.formState.errors.summary?.message}>{props => <Textarea {...props} {...form.register('summary')} rows={3} />}</FormField>}
    <FormField label={t('editor.description')} error={form.formState.errors.description?.message}>{props => <Textarea {...props} {...form.register('description')} rows={8} />}</FormField>
    <FormField label={t('editor.sourceUrl')} error={form.formState.errors.source_url?.message}>{props => <Input {...props} {...form.register('source_url')} type="url" />}</FormField>
    {kind === 'curricular_units' && <RelationPicker kind="courses" label={t('editor.course')} value={form.watch('course_id')} onChange={value => form.setValue('course_id', value, { shouldValidate: true, shouldDirty: true })} error={form.formState.errors.course_id?.message} />}
    {kind !== 'learning_objects' && <RelationPicker kind="learning_objects" label={t('editor.resource')} value={form.watch('learning_object_id')} onChange={value => form.setValue('learning_object_id', value, { shouldValidate: true, shouldDirty: true })} error={form.formState.errors.learning_object_id?.message} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={saving || form.formState.isSubmitting}>{t(saving ? 'common.working' : 'common.save')}</Button><Button type="button" variant="outline" disabled={saving} onClick={onCancel}>{t('common.cancel')}</Button></div>
  </form>;
}
