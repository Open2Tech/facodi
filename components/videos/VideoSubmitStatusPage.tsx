import React, { useEffect, useMemo, useState } from 'react';
import {
  getVideoSubmissionStatus,
  submitVideo,
  VideoSubmissionStatus,
} from '../../services/videoSubmissionSource';

type Props = {
  jobId: string;
  onBack: () => void;
  onRetryJob: (jobId: string) => void;
};

const terminalStatuses = new Set(['succeeded', 'failed', 'needs_review', 'cancelled']);

const stepLabels: Record<string, string> = {
  submitted: 'Submetido',
  v2_fetch_youtube_metadata: 'Buscando metadados',
  v2_extract_video_content: 'Extraindo conteudo',
  v2_generate_embeddings: 'Gerando embeddings',
  v2_match_video_candidates: 'Buscando candidatos',
  v2_classify_video: 'Classificando',
  metadata_ready: 'Metadados',
  content_ready: 'Conteudo',
  embeddings_ready: 'Embeddings',
  candidates_ready: 'Candidatos',
  classified: 'Classificado',
};

const VideoSubmitStatusPage: React.FC<Props> = ({ jobId, onBack, onRetryJob }) => {
  const [status, setStatus] = useState<VideoSubmissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTerminal = status ? terminalStatuses.has(status.job.status) : false;
  const classification = status?.classification;
  const autoAccepted = Boolean(classification?.metadata?.auto_accepted);
  const events = status?.events || [];

  const stageText = useMemo(() => {
    const step = status?.job.current_step || 'submitted';
    return stepLabels[step] || step;
  }, [status?.job.current_step]);

  const load = async () => {
    try {
      const data = await getVideoSubmissionStatus(jobId);
      setStatus(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      await load();
    };
    tick();
    const id = window.setInterval(() => {
      if (!active || isTerminal) return;
      tick();
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [jobId, isTerminal]);

  const handleRetry = async () => {
    if (!status?.job.input_url) return;
    setIsRetrying(true);
    try {
      const result = await submitVideo({ url: status.job.input_url });
      onRetryJob(result.jobId);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Falha ao reprocessar video.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-10 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Voltar aos videos
      </button>

      <div className="facodi-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <span className="text-[10px] font-black bg-black text-primary px-3 py-1.5 uppercase tracking-[0.2em] mb-4 inline-block">
              Status v2
            </span>
            <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter">
              Processamento de video
            </h1>
          </div>
          <button
            type="button"
            onClick={load}
            className="stark-border px-4 py-3 text-[10px] font-black uppercase tracking-widest"
          >
            Atualizar
          </button>
        </div>

        {isLoading && <div className="facodi-alert">Carregando status...</div>}
        {error && <div className="facodi-alert facodi-alert-error">{error}</div>}

        {status && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stark-border p-4 bg-brand-muted">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</p>
                <p className="text-2xl font-black uppercase">{status.job.status}</p>
              </div>
              <div className="stark-border p-4 bg-brand-muted">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Etapa</p>
                <p className="text-2xl font-black uppercase">{stageText}</p>
              </div>
              <div className="stark-border p-4 bg-brand-muted">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Job</p>
                <p className="text-xs font-bold break-all">{status.job.id}</p>
              </div>
            </div>

            {status.video && (
              <div className="stark-border p-5 flex flex-col md:flex-row gap-5">
                <img
                  src={status.video.thumbnail_url || `https://i.ytimg.com/vi/${status.video.youtube_video_id}/hqdefault.jpg`}
                  alt=""
                  className="w-full md:w-56 aspect-video object-cover stark-border"
                />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Video</p>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{status.video.title || status.video.youtube_video_id}</h2>
                  <p className="text-sm text-gray-500 mt-2">{status.video.channel_title || 'YouTube'}</p>
                </div>
              </div>
            )}

            {classification && (
              <div className={`facodi-alert ${classification.status === 'accepted' ? 'facodi-alert-success' : ''}`}>
                <p className="font-black uppercase tracking-widest text-[10px]">
                  Classificacao: {classification.status}
                </p>
                <p className="text-sm mt-2">
                  Confianca {(Number(classification.confidence) * 100).toFixed(0)}%
                  {autoAccepted ? ' - aceita automaticamente por alta confianca.' : ' - aguardando revisao editorial.'}
                </p>
                {classification.justification && <p className="text-sm mt-2">{classification.justification}</p>}
              </div>
            )}

            {events.length > 0 && (
              <div className="stark-border p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
                  Timeline
                </p>
                <div className="space-y-3">
                  {events.map((event, index) => {
                    const record = event as Record<string, unknown>;
                    const step = String(record.step || '');
                    const eventStatus = String(record.status || '');
                    const eventType = String(record.event_type || '');
                    const message = typeof record.message === 'string' ? record.message : '';
                    return (
                      <div key={String(record.id || index)} className="flex gap-3 items-start">
                        <span
                          className={`mt-1 block w-2.5 h-2.5 stark-border ${
                            eventStatus === 'failed'
                              ? 'bg-red-500'
                              : eventStatus === 'succeeded'
                                ? 'bg-primary'
                                : 'bg-white'
                          }`}
                        />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            {stepLabels[step] || step} · {eventType}
                          </p>
                          <p className="text-xs text-gray-500">
                            Tentativa {String(record.attempt || 1)}
                            {record.created_at ? ` · ${new Date(String(record.created_at)).toLocaleString()}` : ''}
                          </p>
                          {message && <p className="text-sm mt-1">{message}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {status.job.error_message && (
              <div className="facodi-alert facodi-alert-error">
                <p className="font-bold">{status.job.error_code}</p>
                <p>{status.job.error_message}</p>
              </div>
            )}

            {status.job.status === 'failed' && status.job.input_url && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-primary text-black px-5 py-3 text-[10px] font-black uppercase tracking-widest stark-border disabled:opacity-50"
              >
                {isRetrying ? 'Reprocessando...' : 'Reprocessar video'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoSubmitStatusPage;
