import React from 'react';

export interface PublishItemResult {
  title: string;
  success: boolean;
  error?: string;
}

interface EditorialReviewPanelProps {
  selectedCount: number;
  publishing: boolean;
  error: string | null;
  successMessage: string | null;
  publishResults: PublishItemResult[];
  onPublish: () => void;
}

const EditorialReviewPanel: React.FC<EditorialReviewPanelProps> = ({
  selectedCount,
  publishing,
  error,
  successMessage,
  publishResults = [],
  onPublish,
}) => {
  const succeeded = publishResults.filter((r) => r.success).length;
  const failed = publishResults.filter((r) => !r.success);

  return (
    <div className="facodi-card space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">6. Revisão editorial e publicação</h2>
      <p className="text-sm text-gray-700">
        {selectedCount} vídeo(s) selecionado(s) para aceite no fluxo v2 de classificação.
      </p>
      {error && <div className="facodi-alert facodi-alert-error">{error}</div>}
      {successMessage && <div className="facodi-alert facodi-alert-success">{successMessage}</div>}
      {publishResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest">
            {succeeded}/{publishResults.length} enviado(s) com sucesso
            {failed.length > 0 && ` — ${failed.length} falhou`}
          </p>
          {failed.length > 0 && (
            <ul className="space-y-1">
              {failed.map((r, i) => (
                <li key={i} className="text-[11px] text-red-600 stark-border px-3 py-2 bg-red-50">
                  <span className="font-bold">{r.title}</span>: {r.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onPublish}
        disabled={publishing || selectedCount === 0}
        className="bg-primary text-black px-5 py-3 text-[10px] font-black uppercase tracking-widest stark-border disabled:opacity-50"
      >
        {publishing ? 'Publicando...' : 'Aceitar classificações v2'}
      </button>
    </div>
  );
};

export default EditorialReviewPanel;
