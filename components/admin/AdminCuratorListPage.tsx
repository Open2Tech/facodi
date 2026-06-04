import React, { useCallback, useEffect, useState } from 'react';
import { listApplications, updateApplicationStatus } from '../../services/curatorApplicationSource';
import type { EditorApplication } from '../../types';

interface AdminCuratorListPageProps {
  onBack: () => void;
}

const AdminCuratorListPage: React.FC<AdminCuratorListPageProps> = ({ onBack }) => {
  const [rows, setRows] = useState<EditorApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<EditorApplication['status'] | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<EditorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { applications } = await listApplications(statusFilter || undefined, 50, 0);
      setRows(applications);
    } catch (err) {
      console.error('[admin-curator-list] load error', err);
      setError('Erro ao carregar candidaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    try {
      await updateApplicationStatus(id, 'approved');
      setNote('Candidatura aprovada.');
      await load();
    } catch (err) {
      console.error('[admin-curator-list] approve error', err);
      setError('Erro ao aprovar candidatura.');
    }
  };

  const reject = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    try {
      setIsRejecting(true);
      await updateApplicationStatus(id, 'rejected', reason.trim());
      setNote('Candidatura rejeitada.');
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (err) {
      console.error('[admin-curator-list] reject error', err);
      setError('Erro ao rejeitar candidatura.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-12 hover:text-primary"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Painel Admin
      </button>

      <h1 className="text-5xl font-black uppercase tracking-tighter mb-8">Candidaturas de Curadores</h1>

      <div className="stark-border p-6 bg-white mb-8 max-w-xs">
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Estado</label>
        <select className="w-full stark-border px-3 py-2 text-xs uppercase" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EditorApplication['status'] | '')}>
          <option value="">Todos</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      {note && <div className="stark-border p-4 bg-green-50 text-green-700 mb-6">{note}</div>}
      {error && <div className="stark-border p-4 bg-red-50 text-red-700 mb-6">{error}</div>}

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-primary animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="stark-border p-10 bg-brand-muted text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nenhuma candidatura encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className={`stark-border p-6 bg-white ${row.status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}`}>
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{row.status}</p>
                  <p className="text-lg font-black uppercase tracking-tight">{row.full_name}</p>
                  <p className="text-sm text-gray-500">{row.email}</p>
                  {row.specialty_area && <p className="text-xs text-gray-500 mt-2">Especialidade: {row.specialty_area}</p>}
                  {row.motivation && <p className="text-sm text-gray-600 mt-3 max-w-3xl">{row.motivation}</p>}
                </div>
                {row.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(row.id)} className="bg-primary stark-border px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Aprovar</button>
                    <button onClick={() => setRejectTarget(row)} className="stark-border px-4 py-2 text-[9px] font-black uppercase tracking-widest text-red-700">Rejeitar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 px-6 py-8 flex items-center justify-center">
          <div className="w-full max-w-xl stark-border bg-white p-6">
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Rejeitar candidatura</h2>
            <p className="text-sm text-gray-600 mb-4">
              Informe o motivo da rejeicao para {rejectTarget.full_name}.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={5}
              className="w-full stark-border p-3 text-sm mb-4"
              placeholder="Motivo da rejeicao (obrigatorio)"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (isRejecting) return;
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="stark-border px-4 py-2 text-[9px] font-black uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={() => reject(rejectTarget.id, rejectReason)}
                disabled={isRejecting || !rejectReason.trim()}
                className="stark-border px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 disabled:opacity-50"
              >
                {isRejecting ? 'A rejeitar...' : 'Confirmar rejeicao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCuratorListPage;
