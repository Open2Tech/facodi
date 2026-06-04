import React from 'react';
import { Category } from '../types';
import { getCategoryMeta } from '../utils/categoryMeta';

interface Props {
  category: Category | string;
  compact?: boolean;
}

const CategoryBadge: React.FC<Props> = ({ category, compact = false }) => {
  const meta = getCategoryMeta(category);
  const sizeClassName = compact
    ? 'gap-1 px-2.5 py-1 text-[9px] tracking-[0.18em]'
    : 'gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.2em]';

  return (
    <span
      className={`inline-flex items-center uppercase font-black border ${sizeClassName} ${meta.badgeClassName}`}
      title={meta.label}
    >
      <span className={`material-symbols-outlined ${compact ? 'text-xs' : 'text-sm'}`} aria-hidden="true">
        {meta.icon}
      </span>
      <span>{meta.label}</span>
    </span>
  );
};

export default CategoryBadge;