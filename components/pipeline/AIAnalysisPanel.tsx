import React, { useState, useEffect } from 'react';
import { useChannelCuration } from '../../contexts/ChannelCurationContext';
import channelCurationSource from '../../services/channelCurationSource';
import { AIAnalysisResult, Difficulty } from '../../types';

/**
 * AI Analysis Panel - Step 3: Analyze selected videos for pedagogical fit
 * Shows topics, difficulty levels, and pedagogical scores
 */

interface AIAnalysisPanelProps {
  onSuccess?: () => void;
}

type SortOption = 'confidence' | 'title' | 'difficulty';

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ onSuccess }) => {
  const {
    state,
    setAnalysisResults,
    setAnalysisResult,
    setStatus,
    setError,
    setMessage,
  } = useChannelCuration();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('confidence');
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIAnalysisResult> | null>(null);

  // Auto-analyze when component mounts if not already analyzed
  useEffect(() => {
    if (
      state.selectedVideoIds.length > 0 &&
      state.analysisResults.size === 0 &&
      !isAnalyzing
    ) {
      analyzeVideos();
    }
  }, []);

  const analyzeVideos = async () => {
    if (state.selectedVideoIds.length === 0) {
      setError('No videos selected for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setMessage(null);
    setStatus('analyzing');

    try {
      const results = await channelCurationSource.analyzeVideosBatch(
        state.selectedVideoIds
      );
      setAnalysisResults(results);
      setMessage(`Analyzed ${results.size} videos successfully!`);
      setStatus('idle');
      // Don't auto-advance; let the user review before clicking "Map to Playlists"
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setStatus('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startEditingVideo = (videoId: string) => {
    const result = state.analysisResults.get(videoId);
    if (result) {
      setEditingVideoId(videoId);
      setEditForm({ ...result });
    }
  };

  const saveEdit = (videoId: string) => {
    if (editForm) {
      setAnalysisResult(videoId, editForm as AIAnalysisResult);
      setEditingVideoId(null);
      setEditForm(null);
      setMessage('Changes saved');
    }
  };

  const cancelEdit = () => {
    setEditingVideoId(null);
    setEditForm(null);
  };

  const videosWithResults = state.videos
    .filter((video) => state.analysisResults.has(video.videoId))
    .map((video) => ({
      video,
      result: state.analysisResults.get(video.videoId)!,
    }));

  const sortedResults = [...videosWithResults].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        const avgConfA =
          a.result.playlistSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
            (a.result.playlistSuggestions.length || 1) || 0;
        const avgConfB =
          b.result.playlistSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
            (b.result.playlistSuggestions.length || 1) || 0;
        return avgConfB - avgConfA;
      case 'title':
        return a.video.title.localeCompare(b.video.title);
      case 'difficulty':
        const diffOrder = {
          'Foundational (01)': 1,
          'Intermediate (02)': 2,
          'Advanced (03)': 3,
          'Expert (04)': 4,
        };
        return (
          (diffOrder[a.result.difficulty as keyof typeof diffOrder] || 0) -
          (diffOrder[b.result.difficulty as keyof typeof diffOrder] || 0)
        );
      default:
        return 0;
    }
  });

  const filteredResults = sortedResults.filter((item) => {
    const avgConf =
      item.result.playlistSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
        (item.result.playlistSuggestions.length || 1) || 0;
    return avgConf >= minConfidence;
  });

  const difficultyColors: Record<Difficulty, string> = {
    'Foundational (01)': '#4caf50',
    'Intermediate (02)': '#ff9800',
    'Advanced (03)': '#f44336',
    'Expert (04)': '#9c27b0',
  };

  return (
    <div className="ai-analysis-panel">
      <div className="panel-header">
        <h2>Step 3: AI Analysis</h2>
        <p className="subtitle">
          Pedagogical fit analysis for {state.selectedVideoIds.length} selected videos
        </p>
      </div>

      {state.error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {state.error}
          {state.analysisResults.size === 0 && (
            <button onClick={analyzeVideos} disabled={isAnalyzing} className="btn-retry">
              {isAnalyzing ? 'Analyzing...' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {isAnalyzing && (
        <div className="analyzing-state">
          <div className="progress-container">
            <div className="spinner" />
            <p>Analyzing {state.selectedVideoIds.length} videos...</p>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
          </div>
        </div>
      )}

      {state.analysisResults.size > 0 && !isAnalyzing && (
        <>
          <div className="controls">
            <div className="sort-group">
              <label htmlFor="sort">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="select-field"
              >
                <option value="confidence">Confidence ↓</option>
                <option value="title">Title A-Z</option>
                <option value="difficulty">Difficulty Level</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="confidence">Min Confidence: {(minConfidence * 100).toFixed(0)}%</label>
              <input
                id="confidence"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="slider"
              />
            </div>

            <div className="action-group">
              <button onClick={analyzeVideos} disabled={isAnalyzing} className="btn-secondary">
                Re-analyze
              </button>
            </div>
          </div>

          <div className="results-container">
            {filteredResults.length === 0 ? (
              <div className="no-results">
                <p>No results match the current filters.</p>
              </div>
            ) : (
              filteredResults.map((item) => {
                const isEditing = editingVideoId === item.video.videoId;
                const result = isEditing
                  ? (editForm as AIAnalysisResult)
                  : item.result;

                return (
                  <div key={item.video.videoId} className="analysis-card">
                    <div className="card-header">
                      <div className="video-title-section">
                        <h3 className="video-title">{item.video.title}</h3>
                        <span className="video-channel">{item.video.channelName}</span>
                      </div>
                      <div className="card-actions">
                        {!isEditing ? (
                          <button
                            onClick={() => startEditingVideo(item.video.videoId)}
                            className="btn-edit"
                          >
                            ✎ Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => saveEdit(item.video.videoId)}
                              className="btn-save"
                            >
                              ✓ Save
                            </button>
                            <button onClick={cancelEdit} className="btn-cancel">
                              ✕ Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="metrics-row">
                        <div className="metric">
                          <label>Difficulty:</label>
                          {!isEditing ? (
                            <span
                              className="difficulty-badge"
                              style={{
                                backgroundColor:
                                  difficultyColors[result.difficulty] || '#999',
                              }}
                            >
                              {result.difficulty}
                            </span>
                          ) : (
                            <select
                              value={result.difficulty}
                              onChange={(e) =>
                                setEditForm({
                                  ...result,
                                  difficulty: e.target.value as Difficulty,
                                })
                              }
                              className="edit-select"
                            >
                              <option value="Foundational (01)">Foundational</option>
                              <option value="Intermediate (02)">Intermediate</option>
                              <option value="Advanced (03)">Advanced</option>
                              <option value="Expert (04)">Expert</option>
                            </select>
                          )}
                        </div>

                        <div className="metric">
                          <label>Pedagogical Score:</label>
                          <div className="score-bar">
                            <div
                              className="score-fill"
                              style={{ width: `${result.pedagogicalScore * 100}%` }}
                            />
                          </div>
                          <span className="score-value">
                            {(result.pedagogicalScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="topics-section">
                        <label>Topics:</label>
                        <div className="topics-list">
                          {!isEditing ? (
                            result.topics.length > 0 ? (
                              result.topics.map((topic, idx) => (
                                <span key={idx} className="topic-badge">
                                  {topic}
                                </span>
                              ))
                            ) : (
                              <span className="no-topics">No topics identified</span>
                            )
                          ) : (
                            <input
                              type="text"
                              value={result.topics.join(', ')}
                              onChange={(e) =>
                                setEditForm({
                                  ...result,
                                  topics: e.target.value.split(',').map((t) => t.trim()),
                                })
                              }
                              className="edit-input"
                              placeholder="Comma-separated topics"
                            />
                          )}
                        </div>
                      </div>

                      {result.pedagogicalJustification && (
                        <div className="justification-section">
                          <label>Justification:</label>
                          {!isEditing ? (
                            <p className="justification-text">
                              {result.pedagogicalJustification}
                            </p>
                          ) : (
                            <textarea
                              value={result.pedagogicalJustification}
                              onChange={(e) =>
                                setEditForm({
                                  ...result,
                                  pedagogicalJustification: e.target.value,
                                })
                              }
                              className="edit-textarea"
                            />
                          )}
                        </div>
                      )}

                      {result.playlistSuggestions.length > 0 && (
                        <div className="suggestions-section">
                          <label>Suggested Playlists:</label>
                          <div className="suggestions-list">
                            {result.playlistSuggestions.map((suggestion, idx) => (
                              <div key={idx} className="suggestion-item">
                                <div className="suggestion-info">
                                  <strong>{suggestion.playlistName}</strong>
                                  <span className="confidence-badge">
                                    {(suggestion.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="suggestion-reason">{suggestion.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="summary-footer">
            <p>
              {filteredResults.length} of {videosWithResults.length} videos analyzed
            </p>
            <button
              onClick={() => onSuccess?.()}
              disabled={videosWithResults.length === 0}
              className="btn-proceed"
            >
              Map to Playlists →
            </button>
          </div>
        </>
      )}

      <style>{`
        .ai-analysis-panel {
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

        .analyzing-state {
          padding: 3rem 2rem;
          text-align: center;
        }

        .progress-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(0, 102, 204, 0.2);
          border-radius: 50%;
          border-top-color: #0066cc;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .progress-bar {
          width: 100%;
          max-width: 400px;
          height: 0.5rem;
          background: #eee;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0066cc, #0099ff);
          animation: progress 1.5s ease-in-out infinite;
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .controls {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .sort-group,
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sort-group label,
        .filter-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .select-field {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          background-color: white;
        }

        .slider {
          width: 150px;
        }

        .action-group {
          display: flex;
          gap: 0.5rem;
        }

        .btn-secondary {
          padding: 0.5rem 1rem;
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .btn-secondary:hover {
          background-color: #e0e0e0;
        }

        .results-container {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .no-results {
          text-align: center;
          padding: 2rem;
          background: #f9f9f9;
          border-radius: 4px;
          color: #999;
        }

        .analysis-card {
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
          background: white;
        }

        .card-header {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .video-title-section {
          flex: 1;
        }

        .video-title {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
        }

        .video-channel {
          display: block;
          font-size: 0.85rem;
          color: #666;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit,
        .btn-save,
        .btn-cancel {
          padding: 0.4rem 0.8rem;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .btn-edit {
          background-color: #0066cc;
          color: white;
        }

        .btn-edit:hover {
          background-color: #0052a3;
        }

        .btn-save {
          background-color: #4caf50;
          color: white;
        }

        .btn-save:hover {
          background-color: #388e3c;
        }

        .btn-cancel {
          background-color: #f44336;
          color: white;
        }

        .btn-cancel:hover {
          background-color: #d32f2f;
        }

        .card-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .metric label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
          text-transform: uppercase;
        }

        .difficulty-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 3px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
          width: fit-content;
        }

        .score-bar {
          width: 100%;
          height: 0.5rem;
          background: #eee;
          border-radius: 2px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #ffd700);
          transition: width 0.3s;
        }

        .score-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: #333;
        }

        .topics-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .topics-section label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
          text-transform: uppercase;
        }

        .topics-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .topic-badge {
          background: #e3f2fd;
          color: #0066cc;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .no-topics {
          color: #999;
          font-size: 0.9rem;
          font-style: italic;
        }

        .edit-input,
        .edit-textarea {
          padding: 0.5rem;
          border: 1px solid #0066cc;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;
        }

        .edit-textarea {
          min-height: 60px;
          resize: vertical;
        }

        .edit-select {
          padding: 0.5rem;
          border: 1px solid #0066cc;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .justification-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .justification-section label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
          text-transform: uppercase;
        }

        .justification-text {
          margin: 0;
          color: #555;
          line-height: 1.5;
          font-size: 0.9rem;
        }

        .suggestions-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggestions-section label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
          text-transform: uppercase;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggestion-item {
          background: #f0f0f0;
          padding: 0.75rem;
          border-radius: 4px;
        }

        .suggestion-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .suggestion-info strong {
          color: #333;
          font-size: 0.9rem;
        }

        .confidence-badge {
          background: #ffd700;
          color: #333;
          padding: 0.15rem 0.5rem;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .suggestion-reason {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
        }

        .summary-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 0.9rem;
        }

        .btn-proceed {
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

        .btn-proceed:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .btn-proceed:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .metrics-row {
            grid-template-columns: 1fr;
          }

          .controls {
            flex-direction: column;
            gap: 1rem;
          }

          .card-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AIAnalysisPanel;
