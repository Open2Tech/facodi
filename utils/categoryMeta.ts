import { Category } from '../types';

export type CategoryMeta = {
  label: string;
  icon: string;
  badgeClassName: string;
  progressClassName: string;
};

const CATEGORY_META: Record<Category, CategoryMeta> = {
  [Category.ENGINEERING]: {
    label: 'Engineering',
    icon: 'engineering',
    badgeClassName: 'bg-sky-100 text-sky-900 border-sky-900',
    progressClassName: 'bg-sky-700',
  },
  [Category.MATHEMATICS]: {
    label: 'Mathematics',
    icon: 'calculate',
    badgeClassName: 'bg-violet-100 text-violet-900 border-violet-900',
    progressClassName: 'bg-violet-700',
  },
  [Category.COMPUTER_SCIENCE]: {
    label: 'Computer Science',
    icon: 'computer',
    badgeClassName: 'bg-emerald-100 text-emerald-900 border-emerald-900',
    progressClassName: 'bg-emerald-700',
  },
  [Category.ARTS_UI]: {
    label: 'Arts & UI',
    icon: 'palette',
    badgeClassName: 'bg-pink-100 text-pink-900 border-pink-900',
    progressClassName: 'bg-pink-700',
  },
  [Category.ETHICS]: {
    label: 'Ethics & Governance',
    icon: 'gavel',
    badgeClassName: 'bg-amber-100 text-amber-900 border-amber-900',
    progressClassName: 'bg-amber-700',
  },
  [Category.MANAGEMENT]: {
    label: 'Management',
    icon: 'business_center',
    badgeClassName: 'bg-orange-100 text-orange-900 border-orange-900',
    progressClassName: 'bg-orange-700',
  },
  [Category.DESIGN]: {
    label: 'Design',
    icon: 'draw',
    badgeClassName: 'bg-rose-100 text-rose-900 border-rose-900',
    progressClassName: 'bg-rose-700',
  },
  [Category.HUMANITIES]: {
    label: 'Humanities',
    icon: 'menu_book',
    badgeClassName: 'bg-stone-200 text-stone-900 border-stone-900',
    progressClassName: 'bg-stone-700',
  },
  [Category.COMMUNICATION]: {
    label: 'Communication',
    icon: 'campaign',
    badgeClassName: 'bg-cyan-100 text-cyan-900 border-cyan-900',
    progressClassName: 'bg-cyan-700',
  },
};

export function getCategoryMeta(category: Category | string): CategoryMeta {
  const normalizedCategory = Object.values(Category).includes(category as Category)
    ? (category as Category)
    : Category.COMPUTER_SCIENCE;

  return CATEGORY_META[normalizedCategory];
}