import React, { useEffect, useMemo, useState } from 'react';
import { PublicPlaylist, VideoCategory, VideoItem } from '../../types';
import { listPublicCategories, listPublicPlaylists, listPublicVideos, VideoQueryParams } from '../../services/videoSource';
import VideoCard from './VideoCard';
import VideoState from './VideoState';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  onSelectVideo: (id: string) => void;
  onSubmitVideo: () => void;
  t: (key: string) => string;
};

type DurationRange = NonNullable<VideoQueryParams['durationRange']>;

type FilterState = {
  search: string;
  categoryId: string;
  playlistId: string;
  language: string;
  durationRange: DurationRange | '';
};

const DURATION_FILTERS: Array<{ value: DurationRange; label: string; helper: string }> = [
  { value: 'short', label: 'Aulas rápidas', helper: 'até 15 min' },
  { value: 'medium', label: 'Aulas médias', helper: '15-40 min' },
  { value: 'long', label: 'Aulas longas', helper: '+40 min' },
];

const TAG_STOP_WORDS = new Set([
  'aula',
  'aulas',
  'curso',
  'video',
  'videos',
  'parte',
  'para',
  'com',
  'sobre',
  'como',
  'live',
  'facodi',
  'youtube',
]);

const getInitialFilters = (): FilterState => {
  const params = new URLSearchParams(window.location.search);
  const duration = params.get('duration');

  return {
    search: params.get('q') || '',
    categoryId: params.get('category') || '',
    playlistId: params.get('playlist') || '',
    language: params.get('language') || '',
    durationRange: duration === 'short' || duration === 'medium' || duration === 'long' ? duration : '',
  };
};

const compactId = (value?: string): string => {
  if (!value) return 'Sem trilha';
  return value.length > 8 ? value.slice(0, 8).toUpperCase() : value.toUpperCase();
};

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return 'Duração aberta';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

const normalizeWord = (value: string): string => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
);

const getSuggestedTags = (videos: VideoItem[]): string[] => {
  const counts = new Map<string, number>();

  videos.forEach((video) => {
    `${video.title} ${video.description} ${video.channelName}`
      .split(/\s+/)
      .map(normalizeWord)
      .filter((word) => word.length >= 4 && !TAG_STOP_WORDS.has(word))
      .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([word]) => word);
};

const getLanguageLabel = (language: string): string => {
  const normalized = language.toLowerCase();
  if (normalized === 'pt') return 'Português';
  if (normalized === 'en') return 'Inglês';
  if (normalized === 'es') return 'Espanhol';
  return language.toUpperCase();
};

const VideoRail: React.FC<{
  title: string;
  description: string;
  videos: VideoItem[];
  onSelectVideo: (id: string) => void;
}> = ({ title, description, videos, onSelectVideo }) => {
  if (videos.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">{title}</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">{description}</p>
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
          {videos.length} videos
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {videos.slice(0, 8).map((video) => (
          <VideoCard key={video.id} video={video} onSelect={onSelectVideo} />
        ))}
      </div>
    </section>
  );
};

const VideoList: React.FC<Props> = ({ onSelectVideo, onSubmitVideo, t }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [libraryVideos, setLibraryVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [retryKey, setRetryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [filters.search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.categoryId) params.set('category', filters.categoryId);
    if (filters.playlistId) params.set('playlist', filters.playlistId);
    if (filters.language) params.set('language', filters.language);
    if (filters.durationRange) params.set('duration', filters.durationRange);
    const query = params.toString();
    window.history.replaceState({}, '', query ? `/videos?${query}` : '/videos');
  }, [filters]);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      try {
        const [categoryData, playlistData, videoSnapshot] = await Promise.all([
          listPublicCategories(),
          listPublicPlaylists(),
          listPublicVideos({ limit: 120, offset: 0 }),
        ]);
        if (!active) return;
        setCategories(categoryData);
        setPlaylists(playlistData.filter((item) => item.videoCount > 0));
        setLibraryVideos(videoSnapshot);
      } catch (metaError) {
        if (!active) return;
        console.error('[videos] metadata load failed:', metaError);
      }
    };

    loadMeta();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    listPublicVideos({
      search: debouncedSearch || undefined,
      categoryId: filters.categoryId || undefined,
      playlistId: filters.playlistId || undefined,
      language: filters.language || undefined,
      durationRange: filters.durationRange || undefined,
      limit: 80,
      offset: 0,
    })
      .then((data) => {
        if (!active) return;
        setVideos(data);
        setError(null);
      })
      .catch((fetchError) => {
        if (!active) return;
        setVideos([]);
        setError(fetchError instanceof Error ? fetchError.message : t('videos.error'));
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, filters.categoryId, filters.playlistId, filters.language, filters.durationRange, retryKey, t]);

  const languageOptions = useMemo(() => {
    return Array.from(new Set(libraryVideos.map((video) => video.language).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
  }, [libraryVideos]);

  const tagSuggestions = useMemo(() => getSuggestedTags(libraryVideos), [libraryVideos]);

  const activeFilterCount = [
    filters.search,
    filters.categoryId,
    filters.playlistId,
    filters.language,
    filters.durationRange,
  ].filter(Boolean).length;

  const filteredVideos = videos;
  const featuredVideos = useMemo(() => {
    const highConfidence = filteredVideos
      .filter((video) => typeof video.confidence === 'number' && video.confidence >= 0.7)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return (highConfidence.length > 0 ? highConfidence : filteredVideos).slice(0, 8);
  }, [filteredVideos]);

  const recentVideos = useMemo(() => {
    return [...filteredVideos]
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 8);
  }, [filteredVideos]);

  const quickVideos = useMemo(() => (
    filteredVideos.filter((video) => (video.durationSeconds || 0) > 0 && (video.durationSeconds || 0) <= 900).slice(0, 8)
  ), [filteredVideos]);

  const courseRails = useMemo(() => {
    const grouped = new Map<string, VideoItem[]>();
    filteredVideos.forEach((video) => {
      if (!video.courseId) return;
      const current = grouped.get(video.courseId) || [];
      current.push(video);
      grouped.set(video.courseId, current);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);
  }, [filteredVideos]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', categoryId: '', playlistId: '', language: '', durationRange: '' });
  };

  const selectedPlaylist = playlists.find((playlist) => playlist.id === filters.playlistId);
  const selectedCategory = categories.find((category) => category.id === filters.categoryId);
  const averageDuration = filteredVideos.length > 0
    ? Math.round(filteredVideos.reduce((sum, video) => sum + (video.durationSeconds || 0), 0) / filteredVideos.length)
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <section className="mb-10 lg:mb-12">
        <div className="stark-border bg-black text-white p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="max-w-4xl">
              <span className="inline-flex bg-primary text-black stark-border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
                Biblioteca viva
              </span>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
                Biblioteca de Vídeos FACODI
              </h1>
              <p className="text-lg lg:text-2xl text-gray-300 font-medium tracking-tight max-w-3xl">
                Conteúdo audiovisual organizado por trilhas, áreas do conhecimento e curadoria acadêmica aberta.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center min-w-full lg:min-w-[360px]">
              <div className="stark-border border-white/30 p-4">
                <p className="text-3xl font-black text-primary">{libraryVideos.length || filteredVideos.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Vídeos</p>
              </div>
              <div className="stark-border border-white/30 p-4">
                <p className="text-3xl font-black text-primary">{playlists.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Trilhas</p>
              </div>
              <div className="stark-border border-white/30 p-4">
                <p className="text-3xl font-black text-primary">{languageOptions.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Idiomas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lg:sticky lg:top-20 z-20 bg-white/95 backdrop-blur stark-border p-4 lg:p-5 mb-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-3 mb-4">
          <label className="block">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Busca</span>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              className="w-full bg-white stark-border px-5 py-4 text-sm font-bold uppercase tracking-wider outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all"
              placeholder={t('videos.searchPlaceholder')}
            />
          </label>

          <label className="block">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Trilha / playlist</span>
            <select
              value={filters.playlistId}
              onChange={(event) => updateFilter('playlistId', event.target.value)}
              className="w-full bg-white stark-border px-4 py-4 text-sm font-bold uppercase tracking-wider"
            >
              <option value="">{t('videos.allPlaylists')}</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Categoria</span>
            <select
              value={filters.categoryId}
              onChange={(event) => updateFilter('categoryId', event.target.value)}
              className="w-full bg-white stark-border px-4 py-4 text-sm font-bold uppercase tracking-wider"
              disabled={categories.length === 0}
            >
              <option value="">{categories.length === 0 ? 'Categorias em preparação' : t('videos.allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Idioma</span>
            <select
              value={filters.language}
              onChange={(event) => updateFilter('language', event.target.value)}
              className="w-full bg-white stark-border px-4 py-4 text-sm font-bold uppercase tracking-wider"
            >
              <option value="">Todos</option>
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {getLanguageLabel(language)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {DURATION_FILTERS.map((duration) => (
              <button
                key={duration.value}
                type="button"
                onClick={() => updateFilter('durationRange', filters.durationRange === duration.value ? '' : duration.value)}
                className={`stark-border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                  filters.durationRange === duration.value ? 'bg-primary text-black' : 'bg-white hover:bg-brand-muted text-gray-600'
                }`}
              >
                {duration.label}
                <span className="ml-2 text-gray-400">{duration.helper}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {tagSuggestions.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => updateFilter('search', tag)}
                className={`stark-border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                  filters.search.toLowerCase() === tag ? 'bg-black text-primary' : 'bg-white hover:bg-primary text-gray-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-black/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Filtros ativos</span>
            {filters.search && <span className="stark-border px-2 py-1 text-[9px] font-bold uppercase">Busca: {filters.search}</span>}
            {selectedPlaylist && <span className="stark-border px-2 py-1 text-[9px] font-bold uppercase">Trilha: {selectedPlaylist.name}</span>}
            {selectedCategory && <span className="stark-border px-2 py-1 text-[9px] font-bold uppercase">Categoria: {selectedCategory.name}</span>}
            {filters.language && <span className="stark-border px-2 py-1 text-[9px] font-bold uppercase">Idioma: {getLanguageLabel(filters.language)}</span>}
            {filters.durationRange && <span className="stark-border px-2 py-1 text-[9px] font-bold uppercase">Duração: {filters.durationRange}</span>}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-[9px] font-black uppercase tracking-widest underline hover:text-black text-gray-500"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {user && (
        <div className="mb-12 flex justify-end">
          <button
            type="button"
            onClick={onSubmitVideo}
            className="bg-primary text-black px-6 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Enviar video
          </button>
        </div>
      )}

      {isLoading && <VideoState type="loading" title={t('videos.loading')} />}

      {!isLoading && error && (
        <VideoState
          type="error"
          title={t('videos.error')}
          message={error}
          actionLabel="Tentar novamente"
          onAction={() => {
            setRetryKey((value) => value + 1);
          }}
        />
      )}

      {!isLoading && !error && filteredVideos.length === 0 && (
        <VideoState type="empty" title={t('videos.empty')} />
      )}

      {!isLoading && !error && filteredVideos.length > 0 && (
        <>
          <VideoRail
            title="Em destaque"
            description="Vídeos com melhor sinal de curadoria ou mais úteis para começar agora."
            videos={featuredVideos}
            onSelectVideo={onSelectVideo}
          />

          <VideoRail
            title="Recentes"
            description="Conteúdos mais recentes na biblioteca pública FACODI."
            videos={recentVideos}
            onSelectVideo={onSelectVideo}
          />

          <VideoRail
            title="Aulas rápidas"
            description="Materiais curtos para estudo entre blocos maiores."
            videos={quickVideos}
            onSelectVideo={onSelectVideo}
          />

          {courseRails.map(([courseId, courseVideos]) => (
            <VideoRail
              key={courseId}
              title={`Curso ${compactId(courseId)}`}
              description="Vídeos associados à mesma estrutura curricular."
              videos={courseVideos}
              onSelectVideo={onSelectVideo}
            />
          ))}

          <section>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">Todos os resultados</h2>
                <p className="text-sm text-gray-500 mt-2">
                  {filteredVideos.length} vídeos encontrados • duração média {formatDuration(averageDuration)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} onSelect={onSelectVideo} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default VideoList;
