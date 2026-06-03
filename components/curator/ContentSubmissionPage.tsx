import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitContent, getMySubmissions } from '../../services/contentSubmissionSource';
import { parseYouTubeVideoId } from '../../services/videoSuggestionSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { ContentSubmission } from '../../types';

interface FormData {
  contentType: 'video' | 'article' | 'interactive' | 'other';
  url: string;
  youtubeVideoId: string;
  suggestedTitle: string;
  summary: string;
  courseId: string;
  unitId: string;
  topic: string;
  pedagogicalReason: string;
  tags: string;
  additionalNotes: string;
}

interface ContentSubmissionPageProps {
  locale?: Locale;
}

export const ContentSubmissionPage: React.FC<ContentSubmissionPageProps> = ({ locale = 'pt' }) => {
  const { t } = createTranslator(locale as Locale);
  const { profile } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    contentType: 'video',
    url: '',
    youtubeVideoId: '',
    suggestedTitle: '',
    summary: '',
    courseId: '',
    unitId: '',
    topic: '',
    pedagogicalReason: '',
    tags: '',
    additionalNotes: '',
  });

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Load user's submissions on mount
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const { submissions } = await getMySubmissions(undefined, 10, 0);
        setSubmissions(submissions);
      } catch (err) {
        console.warn('Could not load submissions:', err);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Auto-detect YouTube video ID if URL changes
    if (name === 'url' && formData.contentType === 'video') {
      const videoId = parseYouTubeVideoId(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        youtubeVideoId: videoId || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await submitContent({
        content_type: formData.contentType,
        url: formData.url || undefined,
        youtube_video_id: formData.youtubeVideoId || undefined,
        suggested_title: formData.suggestedTitle,
        summary: formData.summary || undefined,
        course_id: formData.courseId || undefined,
        unit_id: formData.unitId || undefined,
        topic: formData.topic || undefined,
        pedagogical_reason: formData.pedagogicalReason || undefined,
        tags,
        additional_notes: formData.additionalNotes || undefined,
      });

      setSuccess(true);
      setFormData({
        contentType: 'video',
        url: '',
        youtubeVideoId: '',
        suggestedTitle: '',
        summary: '',
        courseId: '',
        unitId: '',
        topic: '',
        pedagogicalReason: '',
        tags: '',
        additionalNotes: '',
      });

      // Refresh submissions
      const { submissions } = await getMySubmissions(undefined, 10, 0);
      setSubmissions(submissions);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'unknown_error';
      if (errorMsg === 'submission_duplicate') {
        setError(t('curator.submit.error.duplicate'));
      } else if (errorMsg === 'invalid_url') {
        setError(t('curator.submit.error.invalidUrl'));
      } else {
        setError(t('curator.submit.error.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="facodi-page">
      <div className="max-w-4xl mx-auto">
        {/* Institutional Guidance Section */}
        <div className="mb-10 bg-brand-muted stark-border p-8">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4">
            {locale === 'pt' ? 'Orientação para envio de conteúdos' : 'Content submission guidance'}
          </h2>
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            {t('institutional.content.submission.text')}
          </p>
        </div>

        {/* Header */}
        <div className="mb-10">
          <span className="text-[10px] font-black bg-black text-primary px-3 py-1.5 uppercase tracking-[0.2em] mb-4 inline-block">Curadoria</span>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter">{t('curator.submit.title')}</h1>
          <p className="text-sm text-gray-500 mt-3 max-w-xl">{t('curator.submit.intro')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="facodi-card">
              {success && (
                <div className="facodi-alert facodi-alert-success">{t('curator.submit.success')}</div>
              )}
              {error && (
                <div className="facodi-alert facodi-alert-error">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contentType" className="facodi-label">
                    {t('curator.submit.contentType')} *
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleChange}
                    className="facodi-input"
                  >
                    <option value="video">Vídeo / Video</option>
                    <option value="article">Artigo / Article</option>
                    <option value="interactive">Interativo / Interactive</option>
                    <option value="other">Outro / Other</option>
                  </select>
                </div>

                {formData.contentType === 'video' && (
                  <div>
                    <label htmlFor="url" className="facodi-label">
                      {t('curator.submit.youtubeUrl')} *
                    </label>
                    <input
                      id="url"
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                      required={formData.contentType === 'video'}
                      className="facodi-input"
                    />
                    {formData.youtubeVideoId && (
                      <p className="text-sm text-green-600 mt-2">
                        {t('videoSuggest.detectedVideoId')}: {formData.youtubeVideoId}
                      </p>
                    )}
                  </div>
                )}

                {formData.contentType !== 'video' && (
                  <div>
                    <label htmlFor="url" className="facodi-label">
                      {t('curator.submit.url')}
                    </label>
                    <input
                      id="url"
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className="facodi-input"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="suggestedTitle" className="facodi-label">
                    {t('curator.submit.suggestedTitle')} *
                  </label>
                  <input
                    id="suggestedTitle"
                    type="text"
                    name="suggestedTitle"
                    value={formData.suggestedTitle}
                    onChange={handleChange}
                    required
                    className="facodi-input"
                  />
                </div>

                <div>
                  <label htmlFor="summary" className="facodi-label">
                    {t('curator.submit.summary')}
                  </label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleChange}
                    rows={3}
                    className="facodi-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="courseId" className="facodi-label">
                      {t('curator.submit.courseId')}
                    </label>
                    <input
                      id="courseId"
                      type="text"
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleChange}
                      placeholder="ex: CC"
                      className="facodi-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="unitId" className="facodi-label">
                      {t('curator.submit.unitId')}
                    </label>
                    <input
                      id="unitId"
                      type="text"
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      placeholder="ex: 19411003"
                      className="facodi-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="topic" className="facodi-label">
                      {t('curator.submit.topic')}
                    </label>
                    <input
                      id="topic"
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="facodi-input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pedagogicalReason" className="facodi-label">
                    {t('curator.submit.pedagogicalReason')}
                  </label>
                  <textarea
                    id="pedagogicalReason"
                    name="pedagogicalReason"
                    value={formData.pedagogicalReason}
                    onChange={handleChange}
                    rows={3}
                    className="facodi-input resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="tags" className="facodi-label">
                    {t('curator.submit.tags')}
                  </label>
                  <input
                    id="tags"
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder={locale === 'pt' ? 'Separadas por vírgula' : 'Comma-separated'}
                    className="facodi-input"
                  />
                </div>

                <div>
                  <label htmlFor="additionalNotes" className="facodi-label">
                    {t('curator.submit.additionalNotes')}
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    rows={2}
                    className="facodi-input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="facodi-btn facodi-btn-primary facodi-btn-full"
                >
                  {submitting ? t('curator.submit.submitting') : t('curator.submit.submit')}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Submissions Sidebar */}
          <div>
            <div className="facodi-card sticky top-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-6">{t('curator.mySubmissions.title')}</h3>

              {loadingSubmissions ? (
                <p className="text-slate-600 text-sm">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : submissions.length === 0 ? (
                <p className="text-slate-600 text-sm">{t('curator.mySubmissions.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="border-l-2 border-black pl-3 text-sm">
                      <p className="font-medium text-slate-900 truncate">{sub.suggested_title}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {t('curator.mySubmissions.status.' + sub.status)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(sub.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
