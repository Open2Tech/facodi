import React, { useState } from 'react';
import { useChannelCuration } from '../../contexts/ChannelCurationContext';
import channelCurationSource from '../../services/channelCurationSource';

/**
 * Channel Import Panel - First step of the curation pipeline.
 * Allows curators to import a YouTube channel by various identifiers.
 */

interface ChannelImportPanelProps {
  onSuccess?: () => void;
}

const ChannelImportPanel: React.FC<ChannelImportPanelProps> = ({ onSuccess }) => {
  const { importChannel, setStatus, setError, setMessage } = useChannelCuration();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError('Please enter a channel URL, @handle, channel ID, or channel name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);
    setStatus('importing');

    try {
      const channel = await channelCurationSource.importChannel(identifier.trim());
      importChannel(channel, channel.username || identifier);
      setMessage(`Channel "${channel.username}" imported successfully!`);
      setIdentifier('');
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import channel';
      setError(errorMessage);
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="channel-import-panel">
      <div className="panel-header">
        <h2>Step 1: Import Channel</h2>
        <p className="subtitle">
          Enter a YouTube channel URL, @handle, channel ID, or channel name
        </p>
      </div>

      <form onSubmit={handleImport} className="import-form">
        <div className="form-group">
          <label htmlFor="identifier">Channel Identifier</label>
          <input
            id="identifier"
            type="text"
            placeholder="e.g., https://youtube.com/@channelname or @channelname or UCxxxxx"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isLoading}
            className="input-field"
          />
          <small className="help-text">
            Supported formats: Full URL, @handle, Channel ID, or Channel name
          </small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading || !identifier.trim()}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Importing...
              </>
            ) : (
              'Import Channel'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .channel-import-panel {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
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

        .import-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .input-field {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .input-field:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .help-text {
          color: #999;
          font-size: 0.85rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
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

        @media (max-width: 640px) {
          .channel-import-panel {
            padding: 1.5rem 1rem;
          }

          .panel-header h2 {
            font-size: 1.5rem;
          }

          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ChannelImportPanel;
