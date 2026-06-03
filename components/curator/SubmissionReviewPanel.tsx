import React, { useState, useEffect } from 'react';
import { getSubmissionDetail, updateSubmissionStatus, editSubmissionMetadata } from '../../services/contentSubmissionSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { ContentSubmission } from '../../types';

interface SubmissionReviewPanelProps {
  submissionId: string;
  locale?: Locale;
  onClose?: () => void;
}

export const SubmissionReviewPanel: React.FC<SubmissionReviewPanelProps> = ({
  submissionId,
  locale = 'pt',
  onClose,
}) => {
  const { t } = createTranslator(locale as Locale);

  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editedTitle, setEditedTitle] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [editedReason, setEditedReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Load submission on mount
  useEffect(() => {
    const loadSubmission = async () => {
      try {
        const sub = await getSubmissionDetail(submissionId);
        if (sub) {
          setSubmission(sub);
          setEditedTitle(sub.suggested_title);
          setEditedSummary(sub.summary || '');
          setEditedTags((sub.tags || []).join(', '));
          setEditedReason(sub.pedagogical_reason || '');
          setReviewNotes(sub.review_notes || '');
          setRejectionReason(sub.rejection_reason || '');
        }
      } catch (err) {
        console.error('Error loading submission:', err);
        setError(locale === 'pt' ? 'Erro ao carregar submissão' : 'Error loading submission');
      } finally {
        setLoading(false);
      }
    };

    loadSubmission();
  }, [submissionId, locale]);

  const handleSaveMetadata = async () => {
    if (!submission) return;

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const tags = editedTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await editSubmissionMetadata(submission.id, {
        suggested_title: editedTitle,
        summary: editedSummary || undefined,
        tags,
        pedagogical_reason: editedReason || undefined,
      });

      setEditMode(false);
      setSuccess(locale === 'pt' ? 'Metadados atualizados com sucesso' : 'Metadata updated successfully');

      // Refresh submission
      const updated = await getSubmissionDetail(submissionId);
      if (updated) {
        setSubmission(updated);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(locale === 'pt' ? 'Erro ao atualizar metadados' : 'Error updating metadata');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!submission) return;

    try {
      setUpdating(true);
      setError(null);

      await updateSubmissionStatus(submission.id, 'approved', {
        reviewNotes: reviewNotes || undefined,
      });

      setSuccess(locale === 'pt' ? 'Submissão aprovada com sucesso' : 'Submission approved successfully');

      // Refresh submission
      const updated = await getSubmissionDetail(submissionId);
      if (updated) {
        setSubmission(updated);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(locale === 'pt' ? 'Erro ao aprovar submissão' : 'Error approving submission');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;

    try {
      setUpdating(true);
      setError(null);

      await updateSubmissionStatus(submission.id, 'rejected', {
        reviewNotes: reviewNotes || undefined,
        rejectionReason: rejectionReason || undefined,
      });

      setSuccess(locale === 'pt' ? 'Submissão rejeitada' : 'Submission rejected');

      // Refresh submission
      const updated = await getSubmissionDetail(submissionId);
      if (updated) {
        setSubmission(updated);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(locale === 'pt' ? 'Erro ao rejeitar submissão' : 'Error rejecting submission');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!submission) return;

    try {
      setUpdating(true);
      setError(null);

      await updateSubmissionStatus(submission.id, 'needs_changes', {
        reviewNotes: reviewNotes || undefined,
      });

      setSuccess(locale === 'pt' ? 'Submissão marcada como "Requer Ajustes"' : 'Submission marked as needs changes');

      // Refresh submission
      const updated = await getSubmissionDetail(submissionId);
      if (updated) {
        setSubmission(updated);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(locale === 'pt' ? 'Erro ao solicitar ajustes' : 'Error requesting changes');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white stark-border p-8 rounded-lg text-center">
        <p className="text-slate-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="bg-white stark-border p-8 rounded-lg text-center">
        <p className="text-red-600">{locale === 'pt' ? 'Submissão não encontrada' : 'Submission not found'}</p>
      </div>
    );
  }

  const canReview = submission.status !== 'approved' && submission.status !== 'rejected' && submission.status !== 'published';

  return (
    <div className="bg-white stark-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{submission.suggested_title}</h2>
            <p className="text-slate-600 mt-2">
              {submission.author_name} ({submission.author_email})
            </p>
          </div>
          <span className="inline-block px-4 py-2 rounded-full font-semibold bg-blue-100 text-blue-900 text-sm">
            {t(`curator.mySubmissions.status.${submission.status}`)}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="px-6 md:px-8 pt-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded text-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded text-green-900">
            {success}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{locale === 'pt' ? 'Informações' : 'Information'}</h3>
            <div className="space-y-3 bg-slate-50 p-4 rounded">
              <div>
                <label className="text-sm font-semibold text-slate-700">{locale === 'pt' ? 'Tipo' : 'Type'}</label>
                <p className="text-slate-900">{submission.content_type}</p>
              </div>

              {submission.url && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">URL</label>
                  <a
                    href={submission.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline break-all"
                  >
                    {submission.url}
                  </a>
                </div>
              )}

              {submission.course_id && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    {locale === 'pt' ? 'Curso' : 'Course'}
                  </label>
                  <p className="text-slate-900">{submission.course_id}</p>
                </div>
              )}

              {submission.unit_id && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    {locale === 'pt' ? 'Unidade' : 'Unit'}
                  </label>
                  <p className="text-slate-900">{submission.unit_id}</p>
                </div>
              )}

              {submission.topic && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    {t('curator.submit.topic')}
                  </label>
                  <p className="text-slate-900">{submission.topic}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Edit */}
          {editMode ? (
            <div className="space-y-4 bg-slate-50 p-4 rounded">
              <h3 className="font-bold text-lg">{locale === 'pt' ? 'Editar Metadados' : 'Edit Metadata'}</h3>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('curator.submit.suggestedTitle')}
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('curator.submit.summary')}
                </label>
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('curator.submit.pedagogicalReason')}
                </label>
                <textarea
                  value={editedReason}
                  onChange={(e) => setEditedReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('curator.submit.tags')}
                </label>
                <input
                  type="text"
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder={locale === 'pt' ? 'Separadas por vírgula' : 'Comma-separated'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveMetadata}
                  disabled={updating}
                  className="flex-1 bg-primary text-black py-2 font-bold stark-border rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {updating ? (locale === 'pt' ? 'Salvando...' : 'Saving...') : (locale === 'pt' ? 'Salvar' : 'Save')}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 bg-slate-200 text-slate-900 py-2 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  {locale === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{locale === 'pt' ? 'Metadados' : 'Metadata'}</h3>
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  {locale === 'pt' ? 'Editar' : 'Edit'}
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded">
                {submission.summary && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      {t('curator.submit.summary')}
                    </label>
                    <p className="text-slate-900 mt-1">{submission.summary}</p>
                  </div>
                )}

                {submission.pedagogical_reason && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      {t('curator.submit.pedagogicalReason')}
                    </label>
                    <p className="text-slate-900 mt-1">{submission.pedagogical_reason}</p>
                  </div>
                )}

                {submission.tags && submission.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      {t('curator.submit.tags')}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {submission.tags.map((tag) => (
                        <span key={tag} className="bg-primary text-black px-2 py-1 rounded text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review Panel */}
        {canReview && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded border-l-4 border-amber-400">
              <p className="text-sm font-semibold text-amber-900">
                {locale === 'pt' ? 'Aguardando revisão' : 'Awaiting review'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('curator.reviewPanel.reviewNotes')}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {submission.status !== 'rejected' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('curator.reviewPanel.rejectionReason')}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder={locale === 'pt' ? 'Apenas se rejeitar' : 'Only if rejecting'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-slate-200">
              <button
                onClick={handleApprove}
                disabled={updating}
                className="w-full bg-green-600 text-white py-2 font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updating ? (locale === 'pt' ? 'Processando...' : 'Processing...') : t('curator.reviewPanel.approve')}
              </button>

              <button
                onClick={handleRequestChanges}
                disabled={updating}
                className="w-full bg-orange-600 text-white py-2 font-bold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {updating ? (locale === 'pt' ? 'Processando...' : 'Processing...') : t('curator.reviewPanel.requestChanges')}
              </button>

              <button
                onClick={handleReject}
                disabled={updating}
                className="w-full bg-red-600 text-white py-2 font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updating ? (locale === 'pt' ? 'Processando...' : 'Processing...') : t('curator.reviewPanel.reject')}
              </button>
            </div>
          </div>
        )}

        {!canReview && (
          <div>
            <div className="bg-slate-50 p-4 rounded">
              <h3 className="font-bold text-slate-900 mb-3">{locale === 'pt' ? 'Histórico de Revisão' : 'Review History'}</h3>
              <div className="space-y-3 text-sm">
                {submission.reviewed_at && (
                  <div>
                    <label className="font-semibold text-slate-700">
                      {locale === 'pt' ? 'Data de revisão' : 'Review date'}
                    </label>
                    <p className="text-slate-900">
                      {new Date(submission.reviewed_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                    </p>
                  </div>
                )}

                {submission.review_notes && (
                  <div>
                    <label className="font-semibold text-slate-700">
                      {t('curator.reviewPanel.reviewNotes')}
                    </label>
                    <p className="text-slate-900">{submission.review_notes}</p>
                  </div>
                )}

                {submission.rejection_reason && (
                  <div>
                    <label className="font-semibold text-slate-700">
                      {t('curator.reviewPanel.rejectionReason')}
                    </label>
                    <p className="text-slate-900">{submission.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
