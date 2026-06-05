import React from 'react';
import { PlaylistSuggestion } from '../../../services/channelCurationSource';

interface PlaylistMapperProps {
  suggestions: PlaylistSuggestion[];
}

const getConfidenceColor = (confidence: number): { bg: string; bar: string; text: string } => {
  if (confidence >= 0.8) return { bg: 'bg-green-50', bar: 'bg-green-500', text: 'text-green-700' };
  if (confidence >= 0.6) return { bg: 'bg-blue-50', bar: 'bg-blue-500', text: 'text-blue-700' };
  if (confidence >= 0.4) return { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700' };
  return { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-700' };
};

const SuggestionCard: React.FC<{ item: PlaylistSuggestion; index: number }> = ({ item, index }) => {
  const colors = getConfidenceColor(item.confidence);
  const confidencePercent = Math.round(item.confidence * 100);

  return (
    <div key={item.videoId} className={`${colors.bg} border border-gray-200 p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
            Vídeo #{index + 1} — {item.videoId.substring(0, 16)}...
          </p>
        </div>
        <div className="text-right">
          {item.isFallback && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-200 text-amber-900 px-2 py-0.5 border border-amber-400 mb-2 inline-block">
              📍 Fallback
            </span>
          )}
        </div>
      </div>

      {/* Mapeamento Curricular */}
      <div className="space-y-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Curso</p>
          <p className="text-sm font-black text-gray-800">
            {item.courseTitle || item.courseId || 'Sem mapeamento'}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Unidade Curricular</p>
          <p className="text-sm font-black text-gray-800">
            {item.unitTitle || item.unitId || 'Sem unidade'}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Playlist</p>
          <p className="text-sm font-black text-gray-800">
            {item.playlistName || item.playlistId || 'Sem playlist'}
          </p>
          {item.playlistSlug && <p className="text-[10px] text-gray-500 mt-1">{item.playlistSlug}</p>}
          {item.decisionSource && <p className="text-[10px] text-gray-500 mt-1">Origem: {item.decisionSource}</p>}
        </div>
      </div>

      {/* Confiança */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Confiança do Mapeamento</p>
          <p className={`text-[11px] font-black ${colors.text}`}>{confidencePercent}%</p>
        </div>
        <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
          <div className={`${colors.bar} h-full transition-all`} style={{ width: `${confidencePercent}%` }} />
        </div>
      </div>

      {/* Indicador de Qualidade */}
      <div className="pt-2 border-t border-current border-opacity-10">
        {confidencePercent >= 80 && (
          <p className="text-[10px] text-green-700 font-black">✓ Alta confiança - Recomendado para publicação</p>
        )}
        {confidencePercent >= 60 && confidencePercent < 80 && (
          <p className="text-[10px] text-blue-700 font-black">○ Confiança média - Recomenda-se revisar manualmente</p>
        )}
        {confidencePercent < 60 && (
          <p className="text-[10px] text-amber-700 font-black">⚠ Baixa confiança - Revisão manual necessária</p>
        )}
      </div>
    </div>
  );
};

const PlaylistMapper: React.FC<PlaylistMapperProps> = ({ suggestions }) => {
  return (
    <div className="facodi-card space-y-4">
      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">5. Mapeamento pedagógico sugerido</h2>
        {suggestions.length > 0 && (
          <p className="text-[10px] text-gray-500 mt-1">
            {suggestions.length} sugestão(ões) de mapeamento gerada(s)
          </p>
        )}
      </div>
      {!suggestions.length ? (
        <div className="facodi-alert facodi-alert-info">
          Nenhuma sugestão de mapeamento gerada ainda. Execute a análise de vídeos primeiro.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {suggestions.map((item, index) => (
            <SuggestionCard key={item.videoId} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistMapper;
