import React from 'react';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import { useAuth } from '../../contexts/AuthContext';

interface StudentDashboardProps {
  onBack: () => void;
  onSelectCourse: (unitId: string) => void;
  onSelectVideo: (videoId: string) => void;
}

export default function StudentDashboard({
  onBack,
  onSelectCourse,
  onSelectVideo,
}: StudentDashboardProps): React.ReactElement {
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
          <p className="text-sm font-semibold">Autenticação necessária para acessar seu dashboard.</p>
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
          A carregar dashboard...
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
          <p className="font-semibold mb-2">Erro ao carregar dashboard</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const hasEnrollments = dashboard.enrolledCourses.length > 0;
  const formatCompactId = (id: string | null | undefined, fallback: string): string => {
    if (!id) return fallback;
    const compact = id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
    return `${fallback} ${compact}`;
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
          Meus Cursos
        </h1>
        <p className="text-sm text-gray-600">
          Progresso geral: <span className="font-bold">{dashboard.totalProgress}%</span>
        </p>
      </div>

      {!hasEnrollments ? (
        <div className="stark-border bg-brand-muted p-8 text-center">
          <p className="text-sm font-semibold mb-4">Você ainda não se inscreveu em nenhum curso.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <span className="material-symbols-outlined">explore</span>
            Explorar Cursos
          </button>
        </div>
      ) : (
        <>
          <div className="mb-16">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-8">
              Seus Cursos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.enrolledCourses.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="stark-border p-6 hover:bg-brand-muted transition-colors cursor-pointer"
                  onClick={() => onSelectCourse(enrollment.course_id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold flex-1">{formatCompactId(enrollment.course_id, 'Curso')}</h3>
                    <span className="text-xs font-bold uppercase bg-primary text-black px-2 py-1 stark-border">
                      {enrollment.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">Progresso</span>
                      <span className="text-xs font-bold">{enrollment.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-brand-muted stark-border overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${enrollment.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Último acesso: {enrollment.last_accessed_at
                      ? new Date(enrollment.last_accessed_at).toLocaleDateString('pt-PT')
                      : 'Não iniciado'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {dashboard.continueWatching.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-8">
                Continue Assistindo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.continueWatching.map((content) => (
                  <div
                    key={content.id}
                    className="stark-border p-6 hover:bg-brand-muted transition-colors cursor-pointer"
                    onClick={() => content.content_id && onSelectVideo(content.content_id)}
                  >
                      <h3 className="text-lg font-bold mb-2">{formatCompactId(content.content_id, 'Conteudo')}</h3>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">Progresso</span>
                        <span className="text-xs font-bold">{content.progress_percentage}%</span>
                      </div>
                        <div className="w-full h-2 bg-brand-muted stark-border overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${content.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(content.watch_seconds ?? 0) > 0 && (
                        <>Assistido: {Math.round((content.watch_seconds ?? 0) / 60)}m</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard.recentActivity.length > 0 && (
            <div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-8">
                Atividades Recentes
              </h2>
              <div className="stark-border p-6">
                <div className="space-y-4">
                  {dashboard.recentActivity.slice(0, 10).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                      <span className="material-symbols-outlined text-sm text-black flex-shrink-0 mt-1">
                        check_circle
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{activity.event_type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
