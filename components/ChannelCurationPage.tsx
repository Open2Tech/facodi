import React, { useState } from 'react';
import { ChannelCurationProvider, useChannelCuration } from '../contexts/ChannelCurationContext';
import ChannelImportPanel from './pipeline/ChannelImportPanel';
import VideoDiscoveryPanel from './pipeline/VideoDiscoveryPanel';
import AIAnalysisPanel from './pipeline/AIAnalysisPanel';
import PlaylistMapper from './pipeline/PlaylistMapper';
import EditorialReviewPanel from './pipeline/EditorialReviewPanel';
import { Locale } from '../data/i18n';

interface ChannelCurationPageProps {
  locale: Locale;
}

type Phase = 'import' | 'discover' | 'analyze' | 'map' | 'review' | 'publish';

/**
 * Main orchestrator for the YouTube channel curation pipeline.
 * Manages phase progression and state sharing across pipeline components.
 */
const ChannelCurationPageContent: React.FC<ChannelCurationPageProps> = ({ locale }) => {
  const { state, setStatus, setError, setMessage } = useChannelCuration();
  const [currentPhase, setCurrentPhase] = useState<Phase>('import');

  const handleImportSuccess = () => {
    setCurrentPhase('discover');
    setStatus('discovering');
  };

  const handleDiscoverSuccess = () => {
    if (state.selectedVideoIds.length === 0) {
      setError('Please select at least one video before proceeding');
      return;
    }
    setCurrentPhase('analyze');
    setStatus('analyzing');
  };

  const handleAnalyzeSuccess = () => {
    setCurrentPhase('map');
    setStatus('mapping');
  };

  const handleMapSuccess = () => {
    setCurrentPhase('review');
    setStatus('reviewing');
  };

  const handleReviewSuccess = () => {
    setCurrentPhase('publish');
    setStatus('publishing');
  };

  const handleBack = () => {
    const phases: Phase[] = ['import', 'discover', 'analyze', 'map', 'review', 'publish'];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex > 0) {
      setCurrentPhase(phases[currentIndex - 1]);
      setError(null);
    }
  };

  const handleReset = () => {
    setCurrentPhase('import');
    setError(null);
    setMessage(null);
  };

  return (
    <div className="channel-curation-page">
      <div className="page-header">
        <div className="header-content">
          <h1>YouTube Channel Curation Pipeline</h1>
          <p className="subtitle">
            Discover, analyze, and curate educational content from YouTube channels
          </p>
        </div>

        <div className="step-indicator">
          {(['import', 'discover', 'analyze', 'map', 'review', 'publish'] as Phase[]).map(
            (phase, index) => (
              <div
                key={phase}
                className={`step ${currentPhase === phase ? 'active' : ''} ${
                  index < ['import', 'discover', 'analyze', 'map', 'review', 'publish'].indexOf(
                    currentPhase
                  )
                    ? 'completed'
                    : ''
                }`}
              >
                <div className="step-number">{index + 1}</div>
                <span className="step-label">
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="page-content">
        {state.error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{state.error}</span>
            <button onClick={() => setError(null)} className="close-btn">
              ✕
            </button>
          </div>
        )}

        {state.message && (
          <div className="success-banner">
            <span className="success-icon">✓</span>
            <span>{state.message}</span>
            <button onClick={() => setMessage(null)} className="close-btn">
              ✕
            </button>
          </div>
        )}

        {currentPhase === 'import' && (
          <ChannelImportPanel onSuccess={handleImportSuccess} />
        )}

        {currentPhase === 'discover' && state.channelId && (
          <VideoDiscoveryPanel onSuccess={handleDiscoverSuccess} />
        )}

        {currentPhase === 'analyze' && (
          <AIAnalysisPanel onSuccess={handleAnalyzeSuccess} />
        )}

        {currentPhase === 'map' && (
          <PlaylistMapper onSuccess={handleMapSuccess} />
        )}

        {currentPhase === 'review' && (
          <EditorialReviewPanel onSuccess={handleReviewSuccess} onBack={handleBack} />
        )}

        {currentPhase === 'publish' && (
          <div className="phase-placeholder">
            <h2>Step 6: Publish Complete</h2>
            <p>Your curated videos have been successfully published!</p>
            <p className="coming-soon">Integration with catalog system coming soon...</p>
          </div>
        )}
      </div>

      <div className="page-footer">
        <button onClick={handleBack} disabled={currentPhase === 'import'} className="btn-secondary">
          ← Back
        </button>

        <div className="footer-spacer" />

        {currentPhase !== 'publish' && (
          <button onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        )}
      </div>

      <style>{`
        .channel-curation-page {
          min-height: 100vh;
          background: #f9f9f9;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .page-header {
          max-width: 1200px;
          margin: 0 auto 3rem auto;
          width: 100%;
        }

        .header-content {
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .subtitle {
          margin: 0;
          color: #666;
          font-size: 1rem;
        }

        .step-indicator {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          min-width: fit-content;
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .step.active {
          opacity: 1;
        }

        .step.completed {
          opacity: 0.7;
        }

        .step-number {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: white;
          border: 2px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #333;
          transition: all 0.2s;
        }

        .step.active .step-number {
          background: #0066cc;
          border-color: #0066cc;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        .step.completed .step-number {
          background: #e8f5e9;
          border-color: #4caf50;
          color: #4caf50;
        }

        .step-label {
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
          color: #666;
          max-width: 80px;
        }

        .page-content {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .error-banner,
        .success-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        .error-banner {
          background: #fff3e0;
          border: 1px solid #ffb74d;
          color: #f57c00;
        }

        .success-banner {
          background: #e8f5e9;
          border: 1px solid #81c784;
          color: #2e7d32;
        }

        .error-icon {
          font-size: 1.3rem;
        }

        .success-icon {
          font-size: 1.3rem;
        }

        .close-btn {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .close-btn:hover {
          opacity: 1;
        }

        .phase-placeholder {
          background: white;
          border-radius: 8px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .phase-placeholder h2 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .phase-placeholder p {
          margin: 0.5rem 0;
          color: #666;
        }

        .coming-soon {
          color: #999;
          font-size: 0.9rem;
          font-style: italic;
        }

        .page-footer {
          max-width: 1200px;
          margin: 3rem auto 0 auto;
          width: 100%;
          display: flex;
          gap: 1rem;
          padding-top: 2rem;
          border-top: 1px solid #ddd;
        }

        .footer-spacer {
          flex: 1;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f5f5f5;
          border-color: #999;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .channel-curation-page {
            padding: 1rem;
          }

          .header-content h1 {
            font-size: 1.8rem;
          }

          .step-indicator {
            gap: 0.5rem;
          }

          .step-label {
            font-size: 0.7rem;
            max-width: 60px;
          }

          .page-footer {
            flex-direction: column;
          }

          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Wraps the curation page with the ChannelCurationProvider context.
 */
const ChannelCurationPage: React.FC<ChannelCurationPageProps> = (props) => {
  return (
    <ChannelCurationProvider>
      <ChannelCurationPageContent {...props} />
    </ChannelCurationProvider>
  );
};

export default ChannelCurationPage;
