import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listVideoClassifications } from '../../services/classificationReviewSource';
import { listApplications } from '../../services/curatorApplicationSource';
import PermissionDenied from '../auth/PermissionDenied';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigate: (view: 'admin-curators' | 'curator-admin-review' | 'curator-channel-pipeline') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onNavigate }) => {
  const { profile } = useAuth();
  const [pendingClassifications, setPendingClassifications] = useState(0);
  const [acceptedClassifications, setAcceptedClassifications] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [needsReview, accepted, { total }] = await Promise.all([
          listVideoClassifications({ needsReview: true, limit: 1, offset: 0 }),
          listVideoClassifications({ status: 'accepted', limit: 1, offset: 0 }),
          listApplications('pending', 1, 0),
        ]);
        setPendingClassifications(needsReview.total);
        setAcceptedClassifications(accepted.total);
        setPendingApplications(total);
      } catch (err) {
        console.error('[admin-dashboard] load error', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (profile?.role !== 'admin') {
    return <PermissionDenied onBack={onBack} requiredRole="Administrador" />;
  }

  const alertCount = pendingClassifications + pendingApplications;

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-12 hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Voltar
      </button>

      <div className="mb-10">
        <span className="text-[10px] font-black bg-black text-primary px-3 py-1.5 uppercase tracking-[0.2em] mb-5 inline-block">
          Administracao
        </span>
        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter">Painel Administrativo</h1>
        {alertCount > 0 && (
          <div className="mt-6 stark-border bg-primary p-4 inline-flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            <p className="text-[10px] font-black uppercase tracking-widest">
              {alertCount} itens aguardando acao
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            <div className="stark-border p-8 bg-white">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Classificações</p>
              <p className="text-5xl font-black">{pendingClassifications}</p>
            </div>
            <div className="stark-border p-8 bg-white">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Aceitas</p>
              <p className="text-5xl font-black">{acceptedClassifications}</p>
            </div>
            <div className="stark-border p-8 bg-white">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Pipeline</p>
              <p className="text-5xl font-black">v2</p>
            </div>
            <div className="stark-border p-8 bg-black text-white">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Curadores</p>
              <p className="text-5xl font-black text-primary">{pendingApplications}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <button
              onClick={() => onNavigate('curator-channel-pipeline')}
              className="stark-border p-10 bg-white hover:bg-primary transition-all text-left"
            >
              <span className="material-symbols-outlined text-2xl mb-3 block">fact_check</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Classificações</p>
              <p className="text-xl font-black uppercase tracking-tight">Revisão v2</p>
            </button>

            <button
              onClick={() => onNavigate('admin-curators')}
              className="stark-border p-10 bg-white hover:bg-primary transition-all text-left"
            >
              <span className="material-symbols-outlined text-2xl mb-3 block">person_add</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Curadoria</p>
              <p className="text-xl font-black uppercase tracking-tight">Candidaturas de Curadores</p>
            </button>

            <button
              onClick={() => onNavigate('curator-admin-review')}
              className="stark-border p-10 bg-brand-muted hover:bg-primary transition-all text-left"
            >
              <span className="material-symbols-outlined text-2xl mb-3 block">smart_display</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Pipeline</p>
              <p className="text-xl font-black uppercase tracking-tight">Canal YouTube</p>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
