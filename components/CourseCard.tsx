
import React from 'react';
import { CurricularUnit } from '../types';
import CategoryBadge from './CategoryBadge';

interface Props {
  unit: CurricularUnit;
  onClick?: (id: string) => void;
  courseTitle?: string;
}

const CourseCard: React.FC<Props> = ({ unit, onClick, courseTitle }) => {
  return (
    <div 
      onClick={() => onClick?.(unit.id)}
      data-testid="unit-card"
      className="group stark-border p-8 bg-white hover:bg-brand-muted transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="flex justify-between items-start mb-8">
        <CategoryBadge category={unit.category} />
        <button 
          className="text-gray-400 hover:text-black transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Handle bookmark
          }}
        >
          <span className="material-symbols-outlined text-xl">bookmark_add</span>
        </button>
      </div>

      {courseTitle && (
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
          {courseTitle}
        </p>
      )}
      
      <h4 className="text-2xl font-bold uppercase tracking-tighter leading-none mb-6 group-hover:text-primary group-hover:bg-black transition-all">
        {unit.name}
      </h4>
      
      <p className="text-sm text-gray-500 font-medium mb-10 line-clamp-3 leading-relaxed">
        {unit.description}
      </p>

      <div className="mt-auto">
        <div className="grid grid-cols-2 gap-y-6 pt-8 border-t border-black/10">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1">Duration</p>
            <p className="text-xs font-bold uppercase">{unit.duration}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1">Contributor</p>
            <p className="text-xs font-bold uppercase">{unit.contributor}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1">Units</p>
            <p className="text-xs font-bold uppercase">{unit.ects} ECTS</p>
          </div>
          <div className="flex items-end justify-end">
            <span className="material-symbols-outlined text-lg bg-primary p-1.5 stark-border group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
