import type { Json } from '@/integrations/supabase/types';
import { validDay } from '@/entities/course/video';

export type HighlightLanguage = 'pt' | 'pt-PT' | 'pt-BR' | 'en' | 'es' | 'fr';
export type HighlightLevel = 'foundation' | 'introductory' | 'intermediate' | 'advanced' | 'advanced_optional';
export interface UnitHighlightFacts {
  language?: HighlightLanguage;
  level?: HighlightLevel;
  publicationYear?: number;
  learningGoal?: string;
}
export interface HighlightMetadataInput {
  language?: string | null;
  metadata?: Json | null;
  objectives?: Json | null;
}

function record(value: Json | null | undefined): Record<string, Json> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Json> : {};
}
function value(value: Json | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Catalogue language, not guaranteed audio/subtitle language for externally hosted items. */
export function highlightLanguage(value: string | null | undefined): HighlightLanguage | undefined {
  const language = value?.trim().replace('_', '-').toLowerCase();
  if (language === 'pt-br') return 'pt-BR';
  if (language === 'pt-pt') return 'pt-PT';
  if (language === 'pt' || language === 'en' || language === 'es' || language === 'fr') return language;
  return undefined;
}

/** Restrict labels to actual levels in editorial metadata; academic degree level is not difficulty. */
export function highlightLevel(meta: Json | null | undefined): HighlightLevel | undefined {
  const data = record(meta);
  const level = value(data.learning_level) || value(data.level);
  if (level === 'foundation' || level === 'fundamentals') return 'foundation';
  if (level === 'introductory' || level === 'intermediate' || level === 'advanced' || level === 'advanced_optional') return level;
  return undefined;
}

/** Year must belong to the original publication, not the editorial import or review day. */
export function publicationYear(meta: Json | null | undefined, currentYear = new Date().getUTCFullYear()): number | undefined {
  const data = record(meta);
  const candidate = value(data.published_date_on_youtube) || value(data.source_publication_date);
  if (!candidate) return undefined;
  const valid = /^\d{4}$/.test(candidate)
    ? candidate
    : validDay(candidate) ? candidate.slice(0, 4) : '';
  if (!valid) return undefined;
  const year = Number(valid);
  return year >= 1900 && year <= currentYear ? year : undefined;
}

/** Only show concrete editorial goals. Generic instructions are not learning outcomes. */
const GENERIC_GOAL = /^(?:percorrer|consultar|relacionar os conceitos com (?:as ucs|a unidade)|realizar a atividade|resolver e conferir|justificar a escolha|explicar os conceitos do modulo|identificar os tres temas|apresentar uma producao|produzir um trabalho|integrar conceitos|explorar os topicos|distinguir conteudos de divulgacao|distinguir aulas estruturadas)/i;
export function specificLearningGoal(objectives: Json | null | undefined): string | undefined {
  if (!Array.isArray(objectives)) return undefined;
  for (const item of objectives) {
    if (typeof item !== 'string') continue;
    const text = item.trim().replace(/\s+/g, ' ');
    if (text.length < 18 || text.length > 170) continue;
    const folded = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!GENERIC_GOAL.test(folded)) return text;
  }
  return undefined;
}

/** Omit absent facts completely; no inferred level, translation, recency or official objectives. */
export function unitHighlightFacts(input: HighlightMetadataInput): UnitHighlightFacts {
  const facts: UnitHighlightFacts = {};
  const language = highlightLanguage(input.language);
  const level = highlightLevel(input.metadata);
  const year = publicationYear(input.metadata);
  const goal = specificLearningGoal(input.objectives);
  if (language) facts.language = language;
  if (level) facts.level = level;
  if (year) facts.publicationYear = year;
  if (goal) facts.learningGoal = goal;
  return facts;
}
