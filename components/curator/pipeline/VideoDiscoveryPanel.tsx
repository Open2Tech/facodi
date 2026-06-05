import React from 'react';
import { ChannelVideo } from '../../../services/channelCurationSource';

interface VideoDiscoveryPanelProps {
  videos: ChannelVideo[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  onLoad: () => void;
  onToggle: (id: string) => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'Duração desconhecida';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const VideoCard: React.FC<{
  video: ChannelVideo;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ video, isSelected, onToggle }) => {
  const placeholderThumb = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="90"%3E%3Crect fill="%23e5e5e5" width="160" height="90"/%3E%3Ctext x="50%" y="50%" font-family="Arial" font-size="12" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EVídeo%3C/text%3E%3C/svg%3E';

  return (
    <label className={`block stark-border p-4 cursor-pointer transition-colors ${isSelected ? 'bg-brand-muted' : 'bg-white hover:bg-gray-50'}`}>
      <div className="flex gap-4 items-start">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 w-4 h-4"
        />
        
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <img
            src={video.thumbnailUrl || placeholderThumb}
            alt={video.title}
            className="w-32 h-20 object-cover stark-border"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholderThumb;
            }}
          />
        </div>

        {/* Informações do vídeo */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-sm font-black leading-tight line-clamp-2">{video.title}</p>
            <p className="text-[11px] text-gray-600 line-clamp-2">{video.channelTitle || 'Canal não informado'}</p>
          </div>

          {/* Descrição do vídeo */}
          {video.description && (
            <p className="text-[10px] text-gray-500 line-clamp-2">{video.description}</p>
          )}

          {/* Metadados */}
          <div className="flex flex-wrap gap-4 text-[10px] text-gray-400">
            {video.durationSeconds && (
              <span>⏱ {formatDuration(video.durationSeconds)}</span>
            )}
            {video.publishedAt && (
              <span>📅 {new Date(video.publishedAt).toLocaleDateString('pt-BR')}</span>
            )}
            {video.tags && video.tags.length > 0 && (
              <span>🏷 {video.tags.slice(0, 2).join(', ')}</span>
            )}
            {video.source === 'youtube_public' && (
              <span>YouTube público</span>
            )}
          </div>
        </div>

        {/* Status de seleção */}
        <div className="flex-shrink-0 text-right">
          {isSelected && (
            <div className="text-primary text-xs font-black">✓ SELECIONADO</div>
          )}
        </div>
      </div>
    </label>
  );
};

const VideoDiscoveryPanel: React.FC<VideoDiscoveryPanelProps> = ({
  videos,
  selectedIds,
  loading,
  error,
  onLoad,
  onToggle,
}) => {
  return (
    <div className="facodi-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">3. Descobrir e selecionar vídeos</h2>
          {videos.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1">
              {selectedIds.length} de {videos.length} vídeo(s) selecionado(s)
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          className="stark-border px-4 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar vídeos'}
        </button>
      </div>
      {error && <div className="facodi-alert facodi-alert-error">{error}</div>}
      {!videos.length && !loading && (
        <div className="facodi-alert facodi-alert-info">Nenhum vídeo carregado ainda. Informe um canal e clique em "Buscar vídeos".</div>
      )}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {videos.map((video) => {
          const isSelected = selectedIds.includes(video.id);
          return (
            <VideoCard
              key={video.id}
              video={video}
              isSelected={isSelected}
              onToggle={() => onToggle(video.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VideoDiscoveryPanel;
