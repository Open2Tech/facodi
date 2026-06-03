import React, { useState, useEffect } from 'react';
import { getMySubmissions } from '../../services/contentSubmissionSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { ContentSubmission } from '../../types';

interface SubmissionListPageProps {
  locale?: Locale;
}

export const SubmissionListPage: React.FC<SubmissionListPageProps> = ({ locale = 'pt' }) => {
  const { t } = createTranslator(locale as Locale);

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentSubmission['status'] | 'all'>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const pageSize = 10;

  // Load submissions on mount and when filter/page changes
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        const status = filter === 'all' ? undefined : filter;
        const { submissions, total } = await getMySubmissions(status, pageSize, page * pageSize);
        setSubmissions(submissions);
        setTotal(total);
      } catch (err) {
        console.error('Error loading submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [filter, page]);

  const statusColors: Record<ContentSubmission['status'], string> = {
    pending: 'bg-yellow-50 border-yellow-200',
    submitted: 'bg-blue-50 border-blue-200',
    in_review: 'bg-indigo-50 border-indigo-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
    needs_changes: 'bg-orange-50 border-orange-200',
    published: 'bg-emerald-50 border-emerald-200',
  };

  const statusTextColors: Record<ContentSubmission['status'], string> = {
    pending: 'text-yellow-900',
    submitted: 'text-blue-900',
    in_review: 'text-indigo-900',
    approved: 'text-green-900',
    rejected: 'text-red-900',
    needs_changes: 'text-orange-900',
    published: 'text-emerald-900',
  };

  const statuses: Array<ContentSubmission['status'] | 'all'> = [
    'all',
    'pending',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'needs_changes',
    'published',
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="facodi-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-2">{t('curator.mySubmissions.title')}</h1>
          <p className="text-slate-600">
            {locale === 'pt' 
              ? `${total} ${total === 1 ? 'submissão' : 'submissões'}`
              : `${total} ${total === 1 ? 'submission' : 'submissions'}`}
          </p>
        </div>

        {/* Filter */}
        <div className="stark-border bg-white p-6 mb-8">
          <label className="facodi-label mb-3">
            {t('curator.mySubmissions.filter')}
          </label>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(0);
                }}
                className={`px-4 py-2 transition-all ${
                  filter === status
                    ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                    : 'stark-border text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-brand-muted'
                }`}
              >
                {status === 'all' 
                  ? (locale === 'pt' ? 'Todas' : 'All')
                  : t(`curator.mySubmissions.status.${status}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="stark-border bg-white p-12 text-center">
            <p className="text-slate-600">{t('curator.mySubmissions.empty')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`stark-border bg-white p-6 border-l-4 ${statusColors[submission.status]}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {submission.suggested_title}
                      </h3>

                      {submission.summary && (
                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">{submission.summary}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs mb-3">
                        {submission.content_type && (
                          <span className="stark-border bg-brand-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            {submission.content_type}
                          </span>
                        )}
                        {submission.course_id && (
                          <span className="stark-border bg-brand-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            {locale === 'pt' ? 'Curso' : 'Course'}: {submission.course_id}
                          </span>
                        )}
                        {submission.unit_id && (
                          <span className="stark-border bg-brand-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            {locale === 'pt' ? 'Unidade' : 'Unit'}: {submission.unit_id}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        {locale === 'pt' ? 'Enviada em' : 'Submitted'}: {' '}
                        {new Date(submission.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`stark-border inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusTextColors[submission.status]}`}>
                        {t(`curator.mySubmissions.status.${submission.status}`)}
                      </span>

                      {submission.review_notes && (
                        <p className="text-xs text-slate-600 mt-2 max-w-xs">
                          <strong>{locale === 'pt' ? 'Notas' : 'Notes'}:</strong> {submission.review_notes}
                        </p>
                      )}

                      {submission.rejection_reason && (
                        <p className="text-xs text-red-600 mt-2 max-w-xs">
                          <strong>{locale === 'pt' ? 'Motivo' : 'Reason'}:</strong> {submission.rejection_reason}
                        </p>
                      )}

                      {submission.reviewed_at && (
                        <p className="text-xs text-slate-500 mt-2">
                          {locale === 'pt' ? 'Revisada em' : 'Reviewed'}: {' '}
                          {new Date(submission.reviewed_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="facodi-btn facodi-btn-secondary"
                >
                  {locale === 'pt' ? 'Anterior' : 'Previous'}
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-4 py-2 facodi-btn ${
                      page === i
                        ? 'bg-primary text-black stark-border text-[9px] font-black uppercase tracking-widest'
                        : 'stark-border hover:bg-brand-muted'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="facodi-btn facodi-btn-secondary"
                >
                  {locale === 'pt' ? 'Próxima' : 'Next'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
