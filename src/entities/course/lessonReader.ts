import { z } from 'zod';
import type { Json } from '@/integrations/supabase/types';

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const amount = z.number().finite().nonnegative();
const amounts = z.array(z.object({ label: z.string(), value: amount })).min(2);
const chart = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('payment'), invoice: amount.positive(), initial: amount, received: z.string(), remaining: z.string() }),
  z.object({ kind: z.literal('bars'), rows: amounts }),
  z.object({ kind: z.literal('parts'), rows: amounts }),
  z.object({ kind: z.literal('flow'), rows: z.array(z.object({ label: z.string(), detail: z.string() })).min(2) }),
  z.object({ kind: z.literal('ledger'), rows: z.array(z.object({ label: z.string(), debit: amount, credit: amount })).min(2) }),
]);
const figure = z.object({ title: z.string(), caption: z.string(), chart });
export type LessonFigure = z.infer<typeof figure>;
export function readFigure(metadata: Json) {
  return z.object({ teaching_figure: figure }).safeParse(metadata).data?.teaching_figure;
}
export function readerEditions(metadata: Json) {
  return z.object({ presentation: z.object({ kind: z.literal('community_course'), layout: z.literal('lesson_reader') }), edition_slugs: z.record(z.string().regex(/^[a-z]{2}$/), slug) }).safeParse(metadata).data?.edition_slugs;
}
export function readerAlias(metadata: Json) {
  const result = z.object({ course_reader: z.object({ slug, lesson: z.number().int().positive() }) }).safeParse(metadata).data;
  return result && readerPath(result.course_reader.slug, result.course_reader.lesson);
}
export function readerPath(courseSlug: string, lesson: number) {
  return `/resources/${encodeURIComponent(courseSlug)}?lesson=${lesson}`;
}
export function lessonNumber(value: string | null, count: number) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= count ? n : 1;
}

const choice = z.object({ label: z.string().min(1), explanation: z.string().min(1), correct: z.boolean() });
const checkpoint = z.object({
  question: z.string().min(1),
  choices: z.array(choice).min(2).max(5).refine(choices => choices.filter(item => item.correct).length === 1),
});
const odooScreen = z.object({
  asset: slug,
  original: z.string().regex(/^[a-zA-Z0-9_-]+\.png$/),
  alt: z.string().min(1), caption: z.string().min(1),
  width: z.number().int().positive(), height: z.number().int().positive(),
});

export type LessonCheckpoint = z.infer<typeof checkpoint>;
export type OdooScreen = z.infer<typeof odooScreen>;
export function readCheckpoint(metadata: Json) {
  return z.object({ checkpoint }).safeParse(metadata).data?.checkpoint;
}
export function readOdooScreen(metadata: Json) {
  return z.object({ odoo_screen: odooScreen }).safeParse(metadata).data?.odoo_screen;
}
