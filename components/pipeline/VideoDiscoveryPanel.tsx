import React, { useState, useEffect } from 'react';
import { useChannelCuration } from '../../contexts/ChannelCurationContext';
import channelCurationSource from '../../services/channelCurationSource';
import { ChannelVideo } from '../../types';

/**
 * Video Discovery Panel - Displays imported videos from YouTube channel.
 * This is where the real video titles and metadata are displayed.
 * PRIORITY: This component fixes the title display issue.
 */

interface VideoDiscoveryPanelProps {
  onSuccess?: () => void;
}

type SortOption = 'newest' | 'mostViewed' | 'alphabetical';

const VideoDiscoveryPanel: React.FC<VideoDiscoveryPanelProps> = ({ onSuccess }) => {
  const {
    state,
    setVideos,
    selectVideo,
    deselectVideo,
    selectAllVideos,
    deselectAllVideos,
    setStatus,
    setError,
    setMessage,
  } = useChannelCuration();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [pageToken, setPageToken] = useState<string | undefined>();

  // Load videos when component mounts or channel is selected
  useEffect(() => {
    if (state.channelId && state.videos.length === 0 && !isLoading) {
      loadVideos();
    }
  }, [state.channelId]);

  const loadVideos = async () => {
    if (!state.channelId) {
      setError('No channel selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('discovering');

    try {
      const result = await channelCurationSource.listChannelVideos(
        state.channelId,
        pageToken,
        50
      );
      
      if (pageToken) {
        // Append to existing videos for pagination
        setVideos([...state.videos, ...result.videos]);
      } else {
        // First load
        setVideos(result.videos);
      }
      
      setMessage(
        `Found ${result.videos.length} videos in channel "${state.channelName}"`
      );
      setPageToken(result.nextPageToken);
      setStatus('idle');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
      setError(errorMessage);
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedVideos = React.useMemo(() => {
    let filtered = state.videos.filter((v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'mostViewed':
        sorted.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
    }

    return sorted;
  }, [state.videos, searchQuery, sortBy]);

  const handleToggleVideo = (videoId: string) => {
    if (state.selectedVideoIds.includes(videoId)) {
      deselectVideo(videoId);
    } else {
      selectVideo(videoId);
    }
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="video-discovery-panel">
      <div className="panel-header">
        <h2>Step 2: Discover Videos</h2>
        <p className="subtitle">
          Found {state.videos.length} videos in "{state.channelName}" · Selected{' '}
          {state.selectedVideoIds.length}
        </p>
      </div>

      {state.error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {state.error}
          {state.channelId && !state.videos.length && (
            <button
              onClick={loadVideos}
              disabled={isLoading}
              className="btn-retry"
            >
              {isLoading ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {state.videos.length === 0 && !isLoading && !state.error && (
        <div className="empty-state">
          <p>No videos found. Import a channel to get started.</p>
        </div>
      )}

      {state.videos.length > 0 && (
        <>
          <div className="controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search videos by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="select-field"
              >
                <option value="newest">Newest</option>
                <option value="mostViewed">Most Viewed</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>

            <div className="selection-actions">
              {state.selectedVideoIds.length === 0 ? (
                <button onClick={selectAllVideos} className="btn-secondary">
                  Select All
                </button>
              ) : (
                <button onClick={deselectAllVideos} className="btn-secondary">
                  Deselect All
                </button>
              )}
            </div>
          </div>

          <div className="videos-grid">
            {filteredAndSortedVideos.map((video) => (
              <div
                key={video.videoId}
                className={`video-card ${
                  state.selectedVideoIds.includes(video.videoId) ? 'selected' : ''
                }`}
                onClick={() => handleToggleVideo(video.videoId)}
              >
                <div className="video-checkbox">
                  <input
                    type="checkbox"
                    checked={state.selectedVideoIds.includes(video.videoId)}
                    onChange={() => handleToggleVideo(video.videoId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="video-thumbnail">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <span>No image</span>
                    </div>
                  )}
                  <div className="duration-badge">{formatDuration(video.duration)}</div>
                </div>

                <div className="video-info">
                  <h3 className="video-title" title={video.title}>
                    {video.title}
                  </h3>
                  <p className="video-channel">{video.channelName}</p>
                  <div className="video-meta">
                    <span className="meta-item">
                      👁 {formatViewCount(video.viewCount)} views
                    </span>
                    <span className="meta-item">📅 {formatDate(video.publishedAt)}</span>
                  </div>
                  {video.description && (
                    <p className="video-description">{video.description.substring(0, 100)}...</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedVideos.length === 0 && searchQuery && (
            <div className="no-results">
              <p>No videos match "{searchQuery}". Try a different search.</p>
            </div>
          )}

          {pageToken && state.videos.length < 1000 && (
            <div className="pagination">
              <button
                onClick={loadVideos}
                disabled={isLoading}
                className="btn-load-more"
              >
                {isLoading ? 'Loading more...' : 'Load More Videos'}
              </button>
            </div>
          )}

          <div className="proceed-footer">
            <p className="selection-count">
              {state.selectedVideoIds.length} of {state.videos.length} videos selected
            </p>
            <button
              onClick={() => onSuccess?.()}
              disabled={state.selectedVideoIds.length === 0}
              className="btn-primary"
            >
              Analyze Selected Videos →
            </button>
          </div>
        </>
      )}

      <style>{`
        .video-discovery-panel {
          width: 100%;
          padding: 2rem 1.5rem;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          margin-bottom: 2rem;
        }

        .panel-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          color: #333;
        }

        .subtitle {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .alert-error {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c00;
        }

        .btn-retry {
          padding: 0.4rem 0.8rem;
          background-color: #c00;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .btn-retry:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state,
        .no-results {
          text-align: center;
          padding: 3rem 1rem;
          color: #999;
          background-color: #f9f9f9;
          border-radius: 4px;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-bar {
          flex: 1;
          min-width: 250px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .filter-group {
          display: flex;
          gap: 0.5rem;
        }

        .select-field {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95rem;
          background-color: white;
          cursor: pointer;
        }

        .selection-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-secondary {
          padding: 0.75rem 1.25rem;
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: background-color 0.2s;
        }

        .btn-secondary:hover {
          background-color: #e0e0e0;
        }

        .btn-load-more {
          padding: 0.75rem 1.5rem;
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .btn-load-more:hover {
          background-color: #e0e0e0;
        }

        .proceed-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
          margin-top: 1.5rem;
        }

        .selection-count {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .video-card {
          background: white;
          border: 2px solid #eee;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .video-card:hover {
          border-color: #ddd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .video-card.selected {
          border-color: #0066cc;
          background-color: #f0f6ff;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .video-checkbox {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          z-index: 2;
        }

        .video-checkbox input {
          width: 1.2rem;
          height: 1.2rem;
          cursor: pointer;
        }

        .video-thumbnail {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          background-color: #000;
          overflow: hidden;
        }

        .video-thumbnail img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ddd 0%, #eee 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }

        .duration-badge {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .video-info {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .video-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .video-channel {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
        }

        .video-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #999;
        }

        .meta-item {
          white-space: nowrap;
        }

        .video-description {
          margin: 0;
          font-size: 0.8rem;
          color: #999;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pagination {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        @media (max-width: 768px) {
          .videos-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1rem;
          }

          .controls {
            flex-direction: column;
            width: 100%;
          }

          .search-bar {
            width: 100%;
          }

          .filter-group,
          .selection-actions {
            width: 100%;
          }

          .select-field {
            flex: 1;
          }
        }

        @media (max-width: 640px) {
          .videos-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }

          .video-card {
            font-size: 0.9rem;
          }

          .video-title {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoDiscoveryPanel;
