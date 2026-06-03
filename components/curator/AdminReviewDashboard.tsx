import React, { useState, useEffect } from 'react';
import { getAdminQueue, getSubmissionCountByStatus } from '../../services/contentSubmissionSource';
import { listApplications } from '../../services/curatorApplicationSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { ContentSubmission, EditorApplication } from '../../types';

interface AdminReviewDashboardProps {
  locale?: Locale;
}

export const AdminReviewDashboard: React.FC<AdminReviewDashboardProps> = ({ locale = 'pt' }) => {
  const { t } = createTranslator(locale as Locale);

  const [activeTab, setActiveTab] = useState<'submissions' | 'applications'>('submissions');
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [applications, setApplications] = useState<EditorApplication[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [submissionFilter, setSubmissionFilter] = useState<ContentSubmission['status'] | ''>('');
  const [appFilter, setAppFilter] = useState<EditorApplication['status'] | ''>('');

  // Load dashboard data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load submissions
        const { submissions } = await getAdminQueue({
          status: submissionFilter || undefined,
          limit: 20,
          offset: 0,
        });
        setSubmissions(submissions);

        // Load submission counts
        const counts = await getSubmissionCountByStatus();
        setStatusCounts(counts);

        // Load applications
        const { applications } = await listApplications(
          appFilter || undefined,
          20,
          0
        );
        setApplications(applications);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionFilter, appFilter]);

  const submissionStatuses: ContentSubmission['status'][] = [
    'pending',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'needs_changes',
    'published',
  ];

  const appStatuses: EditorApplication['status'][] = ['pending', 'approved', 'rejected'];

  return (
    <div className="facodi-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-2">{t('curator.reviewDashboard.title')}</h1>
          <p className="text-slate-600">{locale === 'pt' ? 'Painel administrativo de revisão' : 'Admin review panel'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {submissionStatuses.map((status) => (
            <div key={status} className="stark-border bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                {t(`curator.mySubmissions.status.${status}`)}
              </p>
              <p className="text-2xl font-black text-black mt-1">
                {statusCounts[status] || 0}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="stark-border bg-white mb-8">
          <div className="flex border-b border-black">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 facodi-tab ${
                activeTab === 'submissions'
                  ? 'facodi-tab-active'
                  : ''
              }`}
            >
              {t('curator.reviewDashboard.submissions')}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 facodi-tab ${
                activeTab === 'applications'
                  ? 'facodi-tab-active'
                  : ''
              }`}
            >
              {t('curator.reviewDashboard.applications')}
            </button>
          </div>

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="facodi-label mb-3">
                  {t('curator.reviewDashboard.filter')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSubmissionFilter('')}
                    className={`px-3 py-2 transition-all ${
                      submissionFilter === ''
                        ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                        : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                    }`}
                  >
                    {locale === 'pt' ? 'Todas' : 'All'}
                  </button>
                  {submissionStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSubmissionFilter(status)}
                      className={`px-3 py-2 transition-all ${
                        submissionFilter === status
                          ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                          : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                      }`}
                    >
                      {t(`curator.mySubmissions.status.${status}`)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="text-slate-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : submissions.length === 0 ? (
                <p className="text-slate-600">{t('curator.reviewDashboard.noItems')}</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="stark-border p-4 hover:bg-brand-muted transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-black text-black">{sub.suggested_title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{sub.author_name} ({sub.author_email})</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="stark-border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                              {sub.content_type}
                            </span>
                            {sub.course_id && (
                              <span className="stark-border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                                {sub.course_id}
                              </span>
                            )}
                            {sub.unit_id && (
                              <span className="stark-border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                                {sub.unit_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="stark-border inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                            {t(`curator.mySubmissions.status.${sub.status}`)}
                          </span>
                          <p className="text-[9px] text-gray-400 mt-2">
                            {new Date(sub.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                          </p>
                          <a
                            href={`#submission-${sub.id}`}
                            className="text-[9px] font-black uppercase tracking-widest text-black mt-2 block hover:text-primary"
                          >
                            {locale === 'pt' ? 'Ver detalhe' : 'View details'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="facodi-label mb-3">
                  {t('curator.reviewDashboard.filter')}
                </label>
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
                <p className="text-slate-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : applications.length === 0 ? (
                <p className="text-slate-600">{t('curator.reviewDashboard.noItems')}</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="stark-border p-4 hover:bg-brand-muted transition-colors"
                    >
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
                            {locale === 'pt' ? 'Enviada em' : 'Submitted'}: {' '}
                            {new Date(app.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="stark-border inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                            {t(`curator.apply.status.${app.status}`)}
                          </span>
                          <a
                            href={`#application-${app.id}`}
                            className="text-[9px] font-black uppercase tracking-widest text-black mt-2 block hover:text-primary"
                          >
                            {locale === 'pt' ? 'Ver detalhe' : 'View details'}
                          </a>
                        </div>
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
