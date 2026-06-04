import React, { useMemo, useState } from 'react';
import { submitVideo } from '../../services/videoSubmissionSource';

type Props = {
  onSubmitted: (jobId: string) => void;
  onBack: () => void;
};

function extractYouTubeId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const fromQuery = url.searchParams.get('v');
    if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery;
    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
    const id = marker >= 0 ? parts[marker + 1] : null;
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const VideoSubmitPage: React.FC<Props> = ({ onSubmitted, onBack }) => {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const youtubeId = useMemo(() => extractYouTubeId(url), [url]);
  const thumbnail = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!youtubeId) {
      setError('Informe uma URL ou ID valido do YouTube.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await submitVideo({
        url,
        description,
        language: language || undefined,
      });
      onSubmitted(result.jobId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao enviar video.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-10 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Voltar aos videos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <span className="text-[10px] font-black bg-black text-primary px-3 py-1.5 uppercase tracking-[0.2em] mb-4 inline-block">
            Envio v2
          </span>
          <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            Enviar video
          </h1>
          <p className="text-sm text-gray-500 max-w-xl">
            O video entra no pipeline facodi v2: metadados, texto limpo, embeddings,
            candidatos curriculares e classificacao automatica.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="facodi-card space-y-5">
          <div>
            <label htmlFor="video-url" className="text-[10px] font-black uppercase tracking-widest">
              URL do YouTube
            </label>
            <input
              id="video-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-2 w-full stark-border px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="video-description" className="text-[10px] font-black uppercase tracking-widest">
              Contexto opcional
            </label>
            <textarea
              id="video-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={4}
              className="mt-2 w-full stark-border px-4 py-3 text-sm outline-none"
              placeholder="Explique por que este video pode ajudar uma unidade curricular."
            />
          </div>

          <div>
            <label htmlFor="video-language" className="text-[10px] font-black uppercase tracking-widest">
              Idioma opcional
            </label>
            <select
              id="video-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-2 w-full stark-border px-4 py-3 text-sm outline-none bg-white"
            >
              <option value="">Detectar automaticamente</option>
              <option value="pt">Portugues</option>
              <option value="en">English</option>
              <option value="es">Espanol</option>
              <option value="fr">Francais</option>
            </select>
          </div>

          {thumbnail && (
            <div className="stark-border bg-brand-muted p-4 flex gap-4 items-center">
              <img src={thumbnail} alt="" className="w-32 aspect-video object-cover stark-border" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preview</p>
                <p className="text-sm font-bold break-all">{youtubeId}</p>
              </div>
            </div>
          )}

          {error && <div className="facodi-alert facodi-alert-error">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting || !youtubeId}
            className="bg-primary text-black px-5 py-4 text-[10px] font-black uppercase tracking-widest stark-border disabled:opacity-50 w-full"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar para pipeline v2'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoSubmitPage;
