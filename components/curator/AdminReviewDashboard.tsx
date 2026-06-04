import React, { useEffect, useMemo, useState } from 'react';
import {
  listVideoClassifications,
  reviewVideoClassification,
  VideoClassificationReview,
  VideoClassificationStatus,
} from '../../services/classificationReviewSource';
import { listApplications } from '../../services/curatorApplicationSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { EditorApplication } from '../../types';

interface AdminReviewDashboardProps {
  locale?: Locale;
}

const CLASSIFICATION_STATUSES: VideoClassificationStatus[] = [
  'draft',
  'needs_review',
  'accepted',
  'corrected',
  'rejected',
];

export const AdminReviewDashboard: React.FC<AdminReviewDashboardProps> = ({ locale = 'pt' }) => {
  const { t } = createTranslator(locale as Locale);
  const [activeTab, setActiveTab] = useState<'classifications' | 'applications'>('classifications');
  const [classifications, setClassifications] = useState<VideoClassificationReview[]>([]);
  const [applications, setApplications] = useState<EditorApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<VideoClassificationStatus | ''>('');
  const [appFilter, setAppFilter] = useState<EditorApplication['status'] | ''>('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [{ classifications: rows }, { applications: appRows }] = await Promise.all([
        listVideoClassifications({
          status: statusFilter || undefined,
          limit: 60,
          offset: 0,
        }),
        listApplications(appFilter || undefined, 20, 0),
      ]);
      setClassifications(rows);
      setApplications(appRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, appFilter]);

  const counts = useMemo(() => {
    return classifications.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      if (item.needsReview) acc.needs_review = (acc.needs_review || 0) + 1;
      return acc;
    }, {});
  }, [classifications]);

  const handleReview = async (item: VideoClassificationReview, action: 'accept' | 'reject') => {
    try {
      setActionId(item.id);
      setError(null);
      await reviewVideoClassification(item.id, action);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao rever classificação.');
    } finally {
      setActionId(null);
    }
  };

  const appStatuses: EditorApplication['status'][] = ['pending', 'approved', 'rejected'];

  return (
    <div className="facodi-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-2">
            {t('curator.reviewDashboard.title')}
          </h1>
          <p className="text-gray-600">
            {locale === 'pt' ? 'Revisão editorial v2 de classificações e candidaturas' : 'V2 editorial review for classifications and applications'}
          </p>
        </div>

        {error && <div className="facodi-alert facodi-alert-error mb-6">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {CLASSIFICATION_STATUSES.map((status) => (
            <div key={status} className="stark-border bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{status}</p>
              <p className="text-2xl font-black text-black mt-1">{counts[status] || 0}</p>
            </div>
          ))}
        </div>

        <div className="stark-border bg-white mb-8">
          <div className="flex border-b border-black">
            <button
              onClick={() => setActiveTab('classifications')}
              className={`flex-1 facodi-tab ${activeTab === 'classifications' ? 'facodi-tab-active' : ''}`}
            >
              {locale === 'pt' ? 'Classificações v2' : 'V2 Classifications'}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 facodi-tab ${activeTab === 'applications' ? 'facodi-tab-active' : ''}`}
            >
              {t('curator.reviewDashboard.applications')}
            </button>
          </div>

          {activeTab === 'classifications' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="facodi-label mb-3">{t('curator.reviewDashboard.filter')}</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('')}
                    className={`px-3 py-2 transition-all ${
                      statusFilter === ''
                        ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                        : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                    }`}
                  >
                    {locale === 'pt' ? 'Todas' : 'All'}
                  </button>
                  {CLASSIFICATION_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-2 transition-all ${
                        statusFilter === status
                          ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                          : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="text-gray-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : classifications.length === 0 ? (
                <p className="text-gray-600">{t('curator.reviewDashboard.noItems')}</p>
              ) : (
                <div className="space-y-4">
                  {classifications.map((item) => (
                    <div key={item.id} className="stark-border p-4 hover:bg-brand-muted transition-colors">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {item.thumbnailUrl && (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="w-full lg:w-44 aspect-video object-cover stark-border"
                            loading="lazy"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="stark-border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                              {item.status}
                            </span>
                            <span className="stark-border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                              {Math.round(item.confidence * 100)}%
                            </span>
                            {item.needsReview && (
                              <span className="stark-border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-primary">
                                needs review
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-black">{item.videoTitle}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.channelTitle || item.youtubeVideoId}</p>
                          <p className="text-xs text-gray-600 mt-3">
                            {item.courseTitle || item.courseId || 'Curso não associado'}
                            {item.unitTitle ? ` · ${item.unitTitle}` : ''}
                          </p>
                          {item.justification && (
                            <p className="text-xs text-gray-500 mt-3 leading-relaxed">{item.justification}</p>
                          )}
                        </div>
                        <div className="flex lg:flex-col gap-2 lg:w-36">
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => handleReview(item, 'accept')}
                            className="flex-1 bg-primary text-black stark-border py-2 px-3 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            Aceitar
                          </button>
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => handleReview(item, 'reject')}
                            className="flex-1 bg-white text-black stark-border py-2 px-3 text-[9px] font-black uppercase tracking-widest hover:bg-brand-muted disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="facodi-label mb-3">{t('curator.reviewDashboard.filter')}</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAppFilter('')}
                    className={`px-3 py-2 transition-all ${
                      appFilter === ''
                        ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                        : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                    }`}
                  >
                    {locale === 'pt' ? 'Todas' : 'All'}
                  </button>
                  {appStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setAppFilter(status)}
                      className={`px-3 py-2 transition-all ${
                        appFilter === status
                          ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                          : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                      }`}
                    >
                      {t(`curator.apply.status.${status}`)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="text-gray-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : applications.length === 0 ? (
                <p className="text-gray-600">{t('curator.reviewDashboard.noItems')}</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="stark-border p-4 hover:bg-brand-muted transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-black text-black">{app.full_name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{app.email}</p>
                          {app.specialty_area && (
                            <p className="text-xs text-gray-500 mt-1">
                              {locale === 'pt' ? 'Área' : 'Area'}: {app.specialty_area}
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400 mt-2">
                            {new Date(app.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                          </p>
                        </div>
                        <span className="stark-border inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                          {t(`curator.apply.status.${app.status}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
