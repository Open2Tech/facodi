import React from 'react';

interface ChannelImportPanelProps {
  channelInput: string;
  loading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onValidate: () => void;
}

const ChannelImportPanel: React.FC<ChannelImportPanelProps> = ({
  channelInput,
  loading,
  error,
  onChange,
  onValidate,
}) => {
  return (
    <div className="facodi-card space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">1. Importar canal do YouTube</h2>
      <p className="text-sm text-gray-600 leading-relaxed">
        Informe URL, handle ou ID do canal. O pipeline usa YouTube público, feed Atom e oEmbed.
      </p>
      <div>
        <label htmlFor="channel-input" className="facodi-label">Canal</label>
        <input
          id="channel-input"
          className="facodi-input"
          placeholder="https://www.youtube.com/@Matemateca"
          value={channelInput}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error && <div className="facodi-alert facodi-alert-error">{error}</div>}
      <button
        type="button"
        onClick={onValidate}
        disabled={loading || !channelInput.trim()}
        className="bg-primary text-black px-5 py-3 text-[10px] font-black uppercase tracking-widest stark-border disabled:opacity-50"
      >
        {loading ? 'Validando...' : 'Validar canal'}
      </button>
    </div>
  );
};

export default ChannelImportPanel;
