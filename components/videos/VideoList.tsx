import React, { useEffect, useState } from 'react';
import { PublicPlaylist, VideoCategory, VideoItem } from '../../types';
import { listPublicCategories, listPublicPlaylists, listPublicVideos } from '../../services/videoSource';
import VideoCard from './VideoCard';
import VideoState from './VideoState';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  onSelectVideo: (id: string) => void;
  onSubmitVideo: () => void;
  t: (key: string) => string;
};

const VideoList: React.FC<Props> = ({ onSelectVideo, onSubmitVideo, t }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      try {
        const [categoryData, playlistData] = await Promise.all([
          listPublicCategories(),
          listPublicPlaylists(),
        ]);
        if (!active) return;
        setCategories(categoryData);
        setPlaylists(playlistData.filter((item) => item.videoCount > 0));
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
      search: search || undefined,
      categoryId: categoryId || undefined,
      playlistId: playlistId || undefined,
      limit: 60,
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
  }, [search, categoryId, playlistId, t]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
        <div className="max-w-3xl">
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-6">{t('videos.title')}</h1>
          <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">{t('videos.subtitle')}</p>
        </div>
        {user && (
          <button
            type="button"
            onClick={onSubmitVideo}
            className="bg-primary text-black px-6 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Enviar video
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-white stark-border px-5 py-4 text-sm font-bold uppercase tracking-wider outline-none"
          placeholder={t('videos.searchPlaceholder')}
        />
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="bg-white stark-border px-4 py-4 text-sm font-bold uppercase tracking-wider"
        >
          <option value="">{t('videos.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={playlistId}
          onChange={(event) => setPlaylistId(event.target.value)}
          className="bg-white stark-border px-4 py-4 text-sm font-bold uppercase tracking-wider"
        >
          <option value="">{t('videos.allPlaylists')}</option>
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <VideoState type="loading" title={t('videos.loading')} />}

      {!isLoading && error && (
        <VideoState
          type="error"
          title={t('videos.error')}
          message={error}
          actionLabel="Tentar novamente"
          onAction={() => {
            setSearch((value) => value);
          }}
        />
      )}

      {!isLoading && !error && videos.length === 0 && (
        <VideoState type="empty" title={t('videos.empty')} />
      )}

      {!isLoading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onSelect={onSelectVideo} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
