import React from 'react';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import { useAuth } from '../../contexts/AuthContext';

interface StudentHistoryPageProps {
  onBack: () => void;
}

export default function StudentHistoryPage({
  onBack,
}: StudentHistoryPageProps): React.ReactElement {
  const { user } = useAuth();
  const { data: dashboard, isLoading, error } = useStudentDashboard();

  if (!user) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar
        </button>
        <div className="stark-border bg-brand-muted p-8">
          <p className="text-sm font-semibold">Autenticação necessária para acessar seu histórico.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar
        </button>
        <div className="stark-border bg-brand-muted p-6 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3">
          <span className="material-symbols-outlined animate-pulse">hourglass_top</span>
          A carregar histórico...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar
        </button>
        <div className="stark-border bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold mb-2">Erro ao carregar histórico</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const hasActivity = dashboard.recentActivity.length > 0;

  const getActivityIcon = (eventType: string): string => {
    const iconMap: Record<string, string> = {
      'course_enrolled': 'school',
      'course_started': 'play_arrow',
      'course_completed': 'check_circle',
      'unit_started': 'book',
      'unit_completed': 'done_all',
      'content_started': 'videocam',
      'content_completed': 'task_alt',
      'content_abandoned': 'cancel',
      'video_watched': 'play_circle',
      'resource_accessed': 'description',
      'certificate_earned': 'workspace_premium',
    };
    return iconMap[eventType] || 'history';
  };

  const getActivityLabel = (eventType: string): string => {
    const labelMap: Record<string, string> = {
      'course_enrolled': 'Inscreveu-se em um curso',
      'course_started': 'Iniciou um curso',
      'course_completed': 'Completou um curso',
      'unit_started': 'Iniciou uma unidade',
      'unit_completed': 'Completou uma unidade',
      'content_started': 'Iniciou um conteúdo',
      'content_completed': 'Completou um conteúdo',
      'content_abandoned': 'Abandonou um conteúdo',
      'video_watched': 'Assistiu um vídeo',
      'resource_accessed': 'Acessou um recurso',
      'certificate_earned': 'Ganhou um certificado',
    };
    return labelMap[eventType] || eventType;
  };

  const formatCompactId = (value: unknown, prefix: string): string | null => {
    if (typeof value !== 'string' || value.length === 0) return null;
    const compact = value.length > 8 ? value.slice(0, 8).toUpperCase() : value.toUpperCase();
    return `${prefix} ${compact}`;
  };

  const formatMetadata = (metadata?: Record<string, unknown>): string | null => {
    if (!metadata) return null;
    const details = [
      formatCompactId(metadata.course_id, 'Curso'),
      formatCompactId(metadata.curricular_unit_id, 'Unidade'),
      formatCompactId(metadata.content_id, 'Conteudo'),
      typeof metadata.content_type === 'string' ? `Tipo ${metadata.content_type}` : null,
    ].filter((item): item is string => Boolean(item));

    if (details.length === 0) return null;
    return details.join(' • ');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:opacity-70 transition-opacity"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Voltar
      </button>

      <div className="mb-16">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-4">
          Histórico
        </h1>
        <p className="text-sm text-gray-600">
          Visualize sua atividade de aprendizagem
        </p>
      </div>

      {!hasActivity ? (
        <div className="stark-border bg-brand-muted p-8 text-center">
          <p className="text-sm font-semibold mb-4">Você ainda não tem histórico de atividades.</p>
          <p className="text-xs text-gray-600">
            Comece a aprender para ver suas atividades aqui.
          </p>
        </div>
      ) : (
        <div className="stark-border p-8">
          <div className="space-y-1">
            {dashboard.recentActivity.map((activity, idx) => {
              const date = new Date(activity.created_at);
              const formattedDate = date.toLocaleDateString('pt-PT');
              const formattedTime = date.toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 py-4 px-4 hover:bg-brand-muted transition-colors last:border-b-0 border-b"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-primary text-black stark-border flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">
                      {getActivityIcon(activity.event_type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">
                      {getActivityLabel(activity.event_type)}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {formattedDate} às {formattedTime}
                    </p>
                    {formatMetadata(activity.metadata) && (
                      <p className="text-xs text-gray-500 mt-2">
                        {formatMetadata(activity.metadata)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
