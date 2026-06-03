import React from 'react';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import { useAuth } from '../../contexts/AuthContext';

interface StudentProgressPageProps {
  onBack: () => void;
}

export default function StudentProgressPage({
  onBack,
}: StudentProgressPageProps): React.ReactElement {
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
          <p className="text-sm font-semibold">Autenticação necessária para acessar seu progresso.</p>
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
          A carregar progresso...
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
          <p className="font-semibold mb-2">Erro ao carregar progresso</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const hasEnrollments = dashboard.enrolledCourses.length > 0;

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
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">
          Meu Progresso
        </h1>

        <div className="stark-border p-8 mb-16">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                Progresso Geral
              </p>
              <p className="text-6xl lg:text-8xl font-black tracking-tighter">
                {dashboard.totalProgress}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">
                {dashboard.enrolledCourses.length} {dashboard.enrolledCourses.length === 1 ? 'curso' : 'cursos'}
              </p>
            </div>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300"
              style={{ width: `${dashboard.totalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {!hasEnrollments ? (
        <div className="stark-border bg-brand-muted p-8 text-center">
          <p className="text-sm font-semibold mb-4">Você ainda não tem progresso registrado.</p>
          <p className="text-xs text-gray-600">
            Inscreva-se em um curso para começar a rastrear seu progresso.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dashboard.enrolledCourses.map((enrollment) => (
            <div key={enrollment.id} className="stark-border p-8">
              <h2 className="text-3xl font-bold mb-6">{enrollment.course_id}</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Progresso do Curso</span>
                    <span className="text-sm font-bold text-brand-primary">{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-brand-primary transition-all duration-300"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 bg-brand-muted stark-border">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                      Status
                    </p>
                    <p className="text-lg font-bold">{enrollment.status}</p>
                  </div>
                  <div className="p-4 bg-brand-muted stark-border">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                      Inscrito
                    </p>
                    <p className="text-sm">
                      {enrollment.enrolled_at
                        ? new Date(enrollment.enrolled_at).toLocaleDateString('pt-PT')
                        : '-'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-brand-muted stark-border">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                      Iniciado
                    </p>
                    <p className="text-sm">
                      {enrollment.started_at
                        ? new Date(enrollment.started_at).toLocaleDateString('pt-PT')
                        : '-'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-brand-muted stark-border">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                      Completado
                    </p>
                    <p className="text-sm">
                      {enrollment.completed_at
                        ? new Date(enrollment.completed_at).toLocaleDateString('pt-PT')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
