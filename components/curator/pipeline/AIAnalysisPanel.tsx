import React from 'react';
import { VideoAnalysis } from '../../../services/channelCurationSource';

interface AIAnalysisPanelProps {
  analyses: VideoAnalysis[];
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
}

const DIFFICULTY_COLORS = {
  foundational: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: '🟢 Fundamental' },
  intermediate: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: '🟡 Intermediário' },
  advanced: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: '🔴 Avançado' },
  expert: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: '⚫ Especialista' },
};

const AnalysisCard: React.FC<{ item: VideoAnalysis }> = ({ item }) => {
  const difficulty = item.difficulty as keyof typeof DIFFICULTY_COLORS;
  const colors = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.intermediate;

  return (
    <article className={`${colors.bg} ${colors.border} border stark-border p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`${colors.text} text-[10px] font-black uppercase tracking-widest`}>
              {colors.label}
            </span>
            {item.isFallback && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-amber-200 text-amber-900 px-2 py-0.5 border border-amber-400">
                📍 Fallback
              </span>
            )}
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Tópico: {item.topic}</p>
        </div>
      </div>

      {/* Resumo */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-1">Resumo</p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{item.summary}</p>
      </div>

      {/* Motivo Pedagógico */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-1">Justificativa Pedagógica</p>
        <p className="text-[11px] text-gray-600 leading-relaxed">{item.pedagogicalReason}</p>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-700 px-2 py-1 border border-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analyses, loading, error, onAnalyze }) => {
  return (
    <div className="facodi-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">4. Inferência de playlist</h2>
          {analyses.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1">
              {analyses.length} análise(s) gerada(s)
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 stark-border hover:bg-gray-900"
        >
          {loading ? 'Analisando...' : 'Executar inferência'}
        </button>
      </div>
      {error && (
        <div className="facodi-alert facodi-alert-warning">
          <p className="font-black text-[10px] uppercase tracking-widest">Aviso</p>
          <p className="text-[11px] mt-1">{error}</p>
        </div>
      )}
      {!analyses.length && !loading && (
        <div className="facodi-alert facodi-alert-info">
          Sem inferências ainda. Selecione vídeos e clique em "Executar inferência".
        </div>
      )}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {analyses.map((item) => (
          <AnalysisCard key={item.videoId} item={item} />
        ))}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
