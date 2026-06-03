import React, { useState, useEffect } from 'react';
import { useChannelCuration } from '../../contexts/ChannelCurationContext';
import channelCurationSource from '../../services/channelCurationSource';
import { PlaylistSuggestion } from '../../types';

/**
 * Playlist Mapper - Step 4: Map analyzed videos to playlists
 * Allows curator to assign videos to playlists with drag-drop and manual selection
 */

interface PlaylistMapperProps {
  onSuccess?: () => void;
}

type ViewMode = 'videos' | 'playlists';

const PlaylistMapper: React.FC<PlaylistMapperProps> = ({ onSuccess }) => {
  const {
    state,
    setPlaylistMapping,
    setPlaylistMappings,
    setStatus,
    setError,
    setMessage,
  } = useChannelCuration();

  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('videos');
  const [allSuggestions, setAllSuggestions] = useState<
    Map<string, PlaylistSuggestion[]>
  >(new Map());
  const [draggedVideo, setDraggedVideo] = useState<string | null>(null);

  // Auto-generate suggestions when component mounts
  useEffect(() => {
    if (state.selectedVideoIds.length > 0 && allSuggestions.size === 0 && !isLoading) {
      generateSuggestions();
    }
  }, []);

  const generateSuggestions = async () => {
    if (state.selectedVideoIds.length === 0) {
      setError('No videos selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);
    setStatus('mapping');

    try {
      const videosToAnalyze = state.videos.filter((v) =>
        state.selectedVideoIds.includes(v.videoId)
      );

      const suggestions = await channelCurationSource.generatePlaylistSuggestions(
        videosToAnalyze
      );

      setAllSuggestions(suggestions);

      // Auto-assign best suggestions
      const newMappings = new Map(state.playlistMappings);
      suggestions.forEach((suggs, videoId) => {
        if (suggs.length > 0 && !newMappings.has(videoId)) {
          // Assign to highest confidence suggestion
          const best = suggs.reduce((a, b) =>
            a.confidence > b.confidence ? a : b
          );
          newMappings.set(videoId, best.playlistId);
        }
      });
      setPlaylistMappings(newMappings);

      setMessage('Generated playlist suggestions');
      setStatus('idle');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaylistAssignment = (videoId: string, playlistId: string) => {
    setPlaylistMapping(videoId, playlistId);
    setMessage('Playlist assignment updated');
  };

  const unassignedVideos = state.selectedVideoIds.filter(
    (vid) => !state.playlistMappings.has(vid)
  );

  const playlistGroups = new Map<string, string[]>();
  state.playlistMappings.forEach((playlistId, videoId) => {
    if (!playlistGroups.has(playlistId)) {
      playlistGroups.set(playlistId, []);
    }
    playlistGroups.get(playlistId)!.push(videoId);
  });

  const videosInPlaylists = Array.from(playlistGroups.values()).flat();
  const totalMapped = videosInPlaylists.length;
  const totalSelected = state.selectedVideoIds.length;
  const mappingProgress = totalSelected > 0 ? (totalMapped / totalSelected) * 100 : 0;

  return (
    <div className="playlist-mapper">
      <div className="panel-header">
        <h2>Step 4: Playlist Mapping</h2>
        <p className="subtitle">
          Assign videos to playlists · Progress: {totalMapped}/{totalSelected}
        </p>
      </div>

      {state.error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {state.error}
          <button onClick={generateSuggestions} disabled={isLoading} className="btn-retry">
            {isLoading ? 'Generating...' : 'Retry'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Generating playlist suggestions...</p>
        </div>
      )}

      {!isLoading && allSuggestions.size > 0 && (
        <>
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${mappingProgress}%` }} />
            </div>
            <p className="progress-text">
              {totalMapped} of {totalSelected} videos assigned
            </p>
          </div>

          <div className="view-tabs">
            <button
              onClick={() => setViewMode('videos')}
              className={`tab ${viewMode === 'videos' ? 'active' : ''}`}
            >
              Videos View
            </button>
            <button
              onClick={() => setViewMode('playlists')}
              className={`tab ${viewMode === 'playlists' ? 'active' : ''}`}
            >
              Playlists View ({playlistGroups.size})
            </button>
          </div>

          {viewMode === 'videos' && (
            <div className="videos-view">
              {unassignedVideos.length > 0 && (
                <div className="unassigned-section">
                  <h3>Unassigned Videos ({unassignedVideos.length})</h3>
                  <div className="unassigned-list">
                    {unassignedVideos.map((videoId) => {
                      const video = state.videos.find((v) => v.videoId === videoId);
                      const suggestions = allSuggestions.get(videoId) || [];

                      return (
                        <div
                          key={videoId}
                          className={`video-assignment-card unassigned ${
                            draggedVideo === videoId ? 'dragging' : ''
                          }`}
                          draggable
                          onDragStart={() => setDraggedVideo(videoId)}
                          onDragEnd={() => setDraggedVideo(null)}
                        >
                          <div className="card-header">
                            <strong>{video?.title}</strong>
                            <span className="unassigned-badge">Unassigned</span>
                          </div>

                          {suggestions.length > 0 && (
                            <div className="suggestions-dropdown">
                              <label>Assign to:</label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handlePlaylistAssignment(videoId, e.target.value);
                                  }
                                }}
                                defaultValue=""
                                className="select-field"
                              >
                                <option value="">Select playlist...</option>
                                {suggestions.map((sugg) => (
                                  <option key={sugg.playlistId} value={sugg.playlistId}>
                                    {sugg.playlistName} ({(sugg.confidence * 100).toFixed(0)}%)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {totalMapped > 0 && (
                <div className="assigned-section">
                  <h3>Assigned Videos ({totalMapped})</h3>
                  <div className="assigned-list">
                    {state.selectedVideoIds
                      .filter((vid) => state.playlistMappings.has(vid))
                      .map((videoId) => {
                        const video = state.videos.find((v) => v.videoId === videoId);
                        const playlistId = state.playlistMappings.get(videoId);
                        const suggestions = allSuggestions.get(videoId) || [];
                        const assignedSuggestion = suggestions.find(
                          (s) => s.playlistId === playlistId
                        );

                        return (
                          <div key={videoId} className="video-assignment-card assigned">
                            <div className="card-header">
                              <strong>{video?.title}</strong>
                              <span className="assigned-badge">✓ Assigned</span>
                            </div>

                            <div className="assigned-playlist">
                              <label>Assigned to:</label>
                              <div className="playlist-info">
                                <strong>{assignedSuggestion?.playlistName || playlistId}</strong>
                                {assignedSuggestion && (
                                  <span className="confidence">
                                    {(assignedSuggestion.confidence * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {suggestions.length > 1 && (
                              <div className="change-playlist">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handlePlaylistAssignment(videoId, e.target.value);
                                    }
                                  }}
                                  defaultValue={playlistId}
                                  className="select-field"
                                >
                                  <option disabled>Change playlist...</option>
                                  {suggestions.map((sugg) => (
                                    <option key={sugg.playlistId} value={sugg.playlistId}>
                                      {sugg.playlistName} ({(sugg.confidence * 100).toFixed(0)}%)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'playlists' && (
            <div className="playlists-view">
              {playlistGroups.size === 0 ? (
                <div className="no-playlists">
                  <p>No playlists have been assigned yet.</p>
                </div>
              ) : (
                Array.from(playlistGroups.entries()).map(([playlistId, videoIds]) => (
                  <div key={playlistId} className="playlist-group-card">
                    <div className="group-header">
                      <h3>{playlistId}</h3>
                      <span className="video-count">{videoIds.length} videos</span>
                    </div>

                    <div className="videos-in-playlist">
                      {videoIds.map((videoId) => {
                        const video = state.videos.find((v) => v.videoId === videoId);
                        return (
                          <div key={videoId} className="video-item-in-group">
                            <div className="video-item-info">
                              <strong>{video?.title}</strong>
                              <span className="channel">{video?.channelName}</span>
                            </div>
                            <button
                              onClick={() => setPlaylistMapping(videoId, '')}
                              className="btn-unassign"
                              title="Unassign from this playlist"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="action-footer">
            <div className="validation-info">
              {unassignedVideos.length > 0 ? (
                <span className="warning">
                  ⚠️ {unassignedVideos.length} video(s) still unassigned
                </span>
              ) : (
                <span className="success">✓ All videos assigned</span>
              )}
            </div>

            <div className="footer-actions">
              <button
                onClick={generateSuggestions}
                disabled={isLoading}
                className="btn-secondary"
              >
                Re-generate Suggestions
              </button>
              <button
                onClick={() => onSuccess?.()}
                disabled={unassignedVideos.length > 0 || totalMapped === 0}
                className="btn-primary"
              >
                Review & Publish →
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .playlist-mapper {
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

        .loading-state {
          padding: 3rem 2rem;
          text-align: center;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(0, 102, 204, 0.2);
          border-radius: 50%;
          border-top-color: #0066cc;
          animation: spin 0.6s linear infinite;
          margin: 0 auto 1rem auto;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .progress-section {
          margin-bottom: 2rem;
        }

        .progress-bar {
          width: 100%;
          height: 0.75rem;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          transition: width 0.3s;
        }

        .progress-text {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
          text-align: center;
        }

        .view-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #ddd;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 600;
          color: #666;
          transition: all 0.2s;
        }

        .tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }

        .videos-view,
        .playlists-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .unassigned-section,
        .assigned-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .unassigned-section h3,
        .assigned-section h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
        }

        .unassigned-list,
        .assigned-list {
          display: grid;
          gap: 1rem;
        }

        .video-assignment-card {
          border: 2px solid #ddd;
          border-radius: 6px;
          padding: 1rem;
          background: white;
          transition: all 0.2s;
        }

        .video-assignment-card.unassigned {
          border-color: #ffd700;
          background: #fffbf0;
        }

        .video-assignment-card.assigned {
          border-color: #4caf50;
          background: #f0f8f0;
        }

        .video-assignment-card.dragging {
          opacity: 0.5;
          transform: scale(0.98);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .card-header strong {
          flex: 1;
          color: #333;
          font-size: 0.95rem;
        }

        .unassigned-badge {
          background: #ffd700;
          color: #333;
          padding: 0.25rem 0.75rem;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .assigned-badge {
          background: #4caf50;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .suggestions-dropdown,
        .change-playlist {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggestions-dropdown label,
        .change-playlist label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
        }

        .select-field {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          background-color: white;
        }

        .assigned-playlist {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem;
          background: white;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .assigned-playlist label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
        }

        .playlist-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .playlist-info strong {
          color: #0066cc;
        }

        .confidence {
          background: #e3f2fd;
          color: #0066cc;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .no-playlists {
          text-align: center;
          padding: 2rem;
          background: #f9f9f9;
          border-radius: 4px;
          color: #999;
        }

        .playlist-group-card {
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }

        .group-header {
          padding: 1rem;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .group-header h3 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .video-count {
          background: #0066cc;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .videos-in-playlist {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .video-item-in-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #eee;
        }

        .video-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .video-item-info strong {
          color: #333;
          font-size: 0.9rem;
        }

        .channel {
          color: #999;
          font-size: 0.8rem;
        }

        .btn-unassign {
          padding: 0.3rem 0.6rem;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background-color 0.2s;
        }

        .btn-unassign:hover {
          background: #d32f2f;
        }

        .action-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          border-top: 1px solid #ddd;
        }

        .validation-info {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .warning {
          color: #ffd700;
        }

        .success {
          color: #4caf50;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
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

        .footer-actions {
          display: flex;
          gap: 0.75rem;
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

        @media (max-width: 768px) {
          .action-footer {
            flex-direction: column;
            gap: 1rem;
          }

          .footer-actions {
            width: 100%;
            flex-direction: column;
          }

          .btn-secondary,
          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaylistMapper;
