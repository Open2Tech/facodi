import React, { useState } from 'react';
import { useChannelCuration } from '../../contexts/ChannelCurationContext';
import channelCurationSource from '../../services/channelCurationSource';
import { PublishRequest, PublishResult } from '../../types';

/**
 * Editorial Review Panel - Step 5: Final review before publishing
 * Shows summary and diff preview of all changes
 */

interface EditorialReviewPanelProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const EditorialReviewPanel: React.FC<EditorialReviewPanelProps> = ({
  onSuccess,
  onBack,
}) => {
  const { state, setStatus, setError, setMessage } = useChannelCuration();

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  // Group videos by playlist
  const playlistGroups = new Map<string, string[]>();
  state.playlistMappings.forEach((playlistId, videoId) => {
    if (!playlistGroups.has(playlistId)) {
      playlistGroups.set(playlistId, []);
    }
    playlistGroups.get(playlistId)!.push(videoId);
  });

  const unassignedCount = state.selectedVideoIds.length - state.playlistMappings.size;
  const canPublish =
    state.playlistMappings.size > 0 &&
    unassignedCount === 0 &&
    !isPublishing;

  const handlePublish = async () => {
    if (!canPublish) {
      setError('Cannot publish: incomplete assignments');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setMessage(null);
    setStatus('publishing');

    try {
      const mappings: Record<string, string> = {};
      state.playlistMappings.forEach((playlistId, videoId) => {
        mappings[videoId] = playlistId;
      });

      const request: PublishRequest = {
        channelId: state.channelId || '',
        videoIds: Array.from(state.playlistMappings.keys()),
        mappings,
      };

      const result = await channelCurationSource.publishCuratedVideos(request);
      setPublishResult(result);

      setMessage(
        `Successfully published ${result.publishedCount} videos to ${result.affectedPlaylists.length} playlists`
      );
      setStatus('idle');
      // User must click "Done" to advance — we don't auto-advance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Publish failed';
      setError(errorMessage);
      setStatus('idle');
    } finally {
      setIsPublishing(false);
    }
  };

  if (publishResult) {
    return (
      <div className="editorial-review-panel">
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h2>Published Successfully!</h2>
          <p className="success-message">
            {publishResult.publishedCount} videos have been added to{' '}
            {publishResult.affectedPlaylists.length} playlist(s)
          </p>

          <div className="success-details">
            <div className="detail-item">
              <strong>Videos Published:</strong>
              <span>{publishResult.publishedCount}</span>
            </div>
            <div className="detail-item">
              <strong>Playlists Updated:</strong>
              <span>{publishResult.affectedPlaylists.join(', ') || '—'}</span>
            </div>
            <div className="detail-item">
              <strong>Timestamp:</strong>
              <span>{new Date(publishResult.timestamp).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {publishResult.notes && (
            <div className="notes-section">
              <strong>Notes:</strong>
              <p>{publishResult.notes}</p>
            </div>
          )}

          <button
            onClick={() => onSuccess?.()}
            className="btn-done"
          >
            Done ✓
          </button>
        </div>

        <style>{`
          .editorial-review-panel {
            width: 100%;
            padding: 2rem 1.5rem;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .success-state {
            text-align: center;
            padding: 3rem 2rem;
          }

          .success-icon {
            font-size: 3rem;
            color: #4caf50;
            margin-bottom: 1rem;
          }

          .success-state h2 {
            margin: 0 0 0.5rem 0;
            color: #4caf50;
            font-size: 2rem;
          }

          .success-message {
            margin: 0 0 2rem 0;
            color: #666;
            font-size: 1rem;
          }

          .success-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }

          .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;
            background: #f5f5f5;
            border-radius: 4px;
          }

          .detail-item strong {
            color: #333;
            font-size: 0.9rem;
          }

          .detail-item span {
            color: #0066cc;
            font-weight: 600;
            font-size: 1.1rem;
          }

          .notes-section {
            padding: 1rem;
            background: #e3f2fd;
            border-left: 4px solid #0066cc;
            border-radius: 4px;
            text-align: left;
            max-width: 600px;
            margin: 0 auto;
          }

          .notes-section strong {
            color: #0066cc;
            display: block;
            margin-bottom: 0.5rem;
          }

          .notes-section p {
            margin: 0;
            color: #555;
            line-height: 1.5;
          }

          .btn-done {
            margin-top: 2rem;
            padding: 0.875rem 2.5rem;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: background-color 0.2s;
          }

          .btn-done:hover {
            background-color: #388e3c;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="editorial-review-panel">
      <div className="panel-header">
        <h2>Step 5: Editorial Review</h2>
        <p className="subtitle">Final approval before publishing</p>
      </div>

      {state.error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      {state.message && (
        <div className="alert alert-success">
          {state.message}
        </div>
      )}

      <div className="review-summary">
        <div className="summary-card">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <div className="stat-value">{state.playlistMappings.size}</div>
              <div className="stat-label">Videos</div>
            </div>
            <div className="stat">
              <div className="stat-value">{playlistGroups.size}</div>
              <div className="stat-label">Playlists</div>
            </div>
            {unassignedCount > 0 && (
              <div className="stat warning">
                <div className="stat-value">{unassignedCount}</div>
                <div className="stat-label">Unassigned</div>
              </div>
            )}
          </div>
        </div>

        <div className="validation-card">
          <h3>Validation</h3>
          <div className="validation-items">
            <div className={`validation-item ${state.selectedVideoIds.length > 0 ? 'pass' : 'fail'}`}>
              <span className="check-icon">
                {state.selectedVideoIds.length > 0 ? '✓' : '✕'}
              </span>
              <span>Videos selected ({state.selectedVideoIds.length})</span>
            </div>
            <div className={`validation-item ${state.playlistMappings.size > 0 ? 'pass' : 'fail'}`}>
              <span className="check-icon">
                {state.playlistMappings.size > 0 ? '✓' : '✕'}
              </span>
              <span>Playlists assigned</span>
            </div>
            <div className={`validation-item ${unassignedCount === 0 ? 'pass' : 'fail'}`}>
              <span className="check-icon">
                {unassignedCount === 0 ? '✓' : '✕'}
              </span>
              <span>All videos assigned</span>
            </div>
            <div className={`validation-item ${state.channelId ? 'pass' : 'fail'}`}>
              <span className="check-icon">
                {state.channelId ? '✓' : '✕'}
              </span>
              <span>Channel identified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="diff-preview">
        <h3>Preview</h3>
        <p className="preview-subtitle">Videos grouped by target playlist</p>

        {playlistGroups.size === 0 ? (
          <div className="no-preview">
            <p>No videos assigned yet</p>
          </div>
        ) : (
          <div className="playlist-previews">
            {Array.from(playlistGroups.entries()).map(([playlistId, videoIds]) => (
              <div key={playlistId} className="playlist-preview">
                <div className="preview-header">
                  <h4>{playlistId}</h4>
                  <span className="count">{videoIds.length} videos</span>
                </div>
                <div className="video-list">
                  {videoIds.map((videoId, idx) => {
                    const video = state.videos.find((v) => v.videoId === videoId);
                    return (
                      <div key={videoId} className="video-preview-item">
                        <span className="video-index">{idx + 1}.</span>
                        <div className="video-info">
                          <strong>{video?.title}</strong>
                          <span className="channel">{video?.channelName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="action-footer">
        <button onClick={onBack} disabled={isPublishing} className="btn-secondary">
          ← Back to Edit
        </button>
        <button
          onClick={handlePublish}
          disabled={!canPublish}
          className={`btn-primary ${isPublishing ? 'loading' : ''}`}
        >
          {isPublishing ? (
            <>
              <span className="spinner-small" />
              Publishing...
            </>
          ) : (
            '✓ Approve & Publish'
          )}
        </button>
      </div>

      <style>{`
        .editorial-review-panel {
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
        }

        .alert-error {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c00;
        }

        .alert-success {
          background-color: #efe;
          border: 1px solid #cfc;
          color: #0a0;
        }

        .review-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card,
        .validation-card {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 1.5rem;
          background: #f9f9f9;
        }

        .summary-card h3,
        .validation-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #333;
        }

        .summary-stats {
          display: flex;
          gap: 1.5rem;
          justify-content: space-around;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0066cc;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat.warning .stat-value {
          color: #ffd700;
        }

        .validation-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .validation-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 4px;
          background: white;
        }

        .validation-item.pass {
          border-left: 3px solid #4caf50;
          color: #4caf50;
        }

        .validation-item.fail {
          border-left: 3px solid #f44336;
          color: #f44336;
        }

        .check-icon {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .diff-preview {
          margin-bottom: 2rem;
        }

        .diff-preview h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          color: #333;
        }

        .preview-subtitle {
          margin: 0 0 1rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .no-preview {
          padding: 2rem;
          text-align: center;
          background: #f9f9f9;
          border-radius: 4px;
          color: #999;
        }

        .playlist-previews {
          display: grid;
          gap: 1.5rem;
        }

        .playlist-preview {
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }

        .preview-header {
          padding: 1rem;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #333;
        }

        .count {
          background: #0066cc;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .video-list {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .video-preview-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.5rem;
          background: white;
          border-radius: 3px;
          align-items: flex-start;
        }

        .video-index {
          flex-shrink: 0;
          font-weight: 600;
          color: #0066cc;
          min-width: 20px;
        }

        .video-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .video-info strong {
          color: #333;
          font-size: 0.9rem;
        }

        .channel {
          color: #999;
          font-size: 0.8rem;
        }

        .action-footer {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #ddd;
        }

        .btn-secondary,
        .btn-primary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          color: #333;
        }

        .btn-secondary:hover {
          background-color: #e0e0e0;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #4caf50;
          color: white;
        }

        .btn-primary:hover {
          background-color: #388e3c;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 0.9rem;
          height: 0.9rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .review-summary {
            grid-template-columns: 1fr;
          }

          .action-footer {
            flex-direction: column;
          }

          .btn-secondary,
          .btn-primary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EditorialReviewPanel;
