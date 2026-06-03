import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitCuratorApplication, getUserApplication } from '../../services/curatorApplicationSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { EditorApplication } from '../../types';

interface FormData {
  fullName: string;
  email: string;
  specialtyArea: string;
  experienceSummary: string;
  relevantLinks: string;
  availability: string;
  motivation: string;
  portfolioUrl: string;
  guidelinesAccepted: boolean;
  consentPrivacy: boolean;
}

interface CuratorApplicationPageProps {
  locale?: Locale;
}

export const CuratorApplicationPage: React.FC<CuratorApplicationPageProps> = ({ locale = 'pt' }) => {
  const { t } = createTranslator(locale as Locale);
  const { profile } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: profile?.display_name || '',
    email: '',
    specialtyArea: '',
    experienceSummary: '',
    relevantLinks: '',
    availability: '',
    motivation: '',
    portfolioUrl: '',
    guidelinesAccepted: false,
    consentPrivacy: false,
  });

  const [existingApp, setExistingApp] = useState<EditorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing application on mount
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const app = await getUserApplication();
        if (app) {
          setExistingApp(app);
        }
      } catch (err) {
        console.warn('Could not check existing application:', err);
      } finally {
        setLoading(false);
      }
    };

    checkExisting();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const links = formData.relevantLinks
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      await submitCuratorApplication({
        full_name: formData.fullName,
        email: formData.email,
        specialty_area: formData.specialtyArea,
        experience_summary: formData.experienceSummary,
        relevant_links: links,
        availability: formData.availability,
        motivation: formData.motivation,
        portfolio_url: formData.portfolioUrl,
        guidelines_accepted: formData.guidelinesAccepted,
        consent_privacy: formData.consentPrivacy,
      });

      setSuccess(true);
      setFormData({
        fullName: profile?.display_name || '',
        email: '',
        specialtyArea: '',
        experienceSummary: '',
        relevantLinks: '',
        availability: '',
        motivation: '',
        portfolioUrl: '',
        guidelinesAccepted: false,
        consentPrivacy: false,
      });

      // Refresh existing application
      const updatedApp = await getUserApplication();
      if (updatedApp) {
        setExistingApp(updatedApp);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'unknown_error';
      if (errorMsg === 'application_already_exists') {
        setError(t('curator.apply.error.duplicate'));
      } else {
        setError(t('curator.apply.error.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="facodi-spinner mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">{t('nav.progress')}</p>
        </div>
      </div>
    );
  }

  // If user has an existing application, show status
  if (existingApp) {
    return (
      <div className="facodi-page">
        <div className="max-w-2xl mx-auto">
          <div className="facodi-card">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-6">{t('curator.apply.title')}</h1>
            <div className="facodi-alert facodi-alert-info">
              <p className="text-blue-900">
                {locale === 'pt' 
                  ? 'Você já possui uma candidatura ativa.' 
                  : 'You already have an active application.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  {t('curator.apply.status.' + existingApp.status)}
                </label>
                <p className="text-base text-slate-900 mt-1">{existingApp.status}</p>
              </div>

              {existingApp.review_notes && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    {locale === 'pt' ? 'Notas de revisão' : 'Review notes'}
                  </label>
                  <p className="text-base text-slate-900 mt-1">{existingApp.review_notes}</p>
                </div>
              )}

              {existingApp.reviewed_at && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    {locale === 'pt' ? 'Data de revisão' : 'Review date'}
                  </label>
                  <p className="text-base text-slate-900 mt-1">
                    {new Date(existingApp.reviewed_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="facodi-page">
      <div className="max-w-2xl mx-auto">
        {/* Institutional Context Section */}
        <div className="mb-10 bg-brand-muted stark-border p-8">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4">
            {t('institutional.curator.context.title')}
          </h2>
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            {t('institutional.curator.context.text')}
          </p>
        </div>

        {/* Header */}
        <div className="mb-10">
          <span className="text-[10px] font-black bg-black text-primary px-3 py-1.5 uppercase tracking-[0.2em] mb-4 inline-block">Curadoria</span>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter">{t('curator.apply.title')}</h1>
          <p className="text-sm text-gray-500 mt-3">{t('curator.apply.intro')}</p>
        </div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="facodi-card">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">
              {locale === 'pt' ? 'Responsabilidades' : 'Responsibilities'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• {locale === 'pt' ? 'Revisar e aprovar conteúdo enviado' : 'Review and approve submitted content'}</li>
              <li>• {locale === 'pt' ? 'Mapear unidades curriculares' : 'Map curricular units'}</li>
              <li>• {locale === 'pt' ? 'Organizar playlists' : 'Organize playlists'}</li>
              <li>• {locale === 'pt' ? 'Garantir qualidade do catálogo' : 'Ensure catalog quality'}</li>
            </ul>
          </div>

          <div className="facodi-card">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">
              {locale === 'pt' ? 'Tipos de conteúdo' : 'Content types'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Vídeos / Videos</li>
              <li>• Artigos / Articles</li>
              <li>• Recursos interativos / Interactive resources</li>
              <li>• PDFs e documentos / Docs</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <div className="facodi-card">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8">{t('curator.apply.form.submit')}</h2>

          {success && (
            <div className="facodi-alert facodi-alert-success">{t('curator.apply.success')}</div>
          )}
          {error && (
            <div className="facodi-alert facodi-alert-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="facodi-label">
                {t('curator.apply.form.fullName')} *
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="facodi-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="facodi-label">
                {t('curator.apply.form.email')} *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="facodi-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="specialtyArea" className="facodi-label">
                  {t('curator.apply.form.specialtyArea')}
                </label>
                <input
                  id="specialtyArea"
                  type="text"
                  name="specialtyArea"
                  value={formData.specialtyArea}
                  onChange={handleChange}
                  className="facodi-input"
                />
              </div>

              <div>
                <label htmlFor="availability" className="facodi-label">
                  {t('curator.apply.form.availability')}
                </label>
                <input
                  id="availability"
                  type="text"
                  name="availability"
                  placeholder={locale === 'pt' ? 'ex: 10h/semana' : 'e.g. 10h/week'}
                  value={formData.availability}
                  onChange={handleChange}
                  className="facodi-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="experienceSummary" className="facodi-label">
                {t('curator.apply.form.experienceSummary')}
              </label>
              <textarea
                id="experienceSummary"
                name="experienceSummary"
                value={formData.experienceSummary}
                onChange={handleChange}
                rows={3}
                className="facodi-input resize-none"
              />
            </div>

            <div>
              <label htmlFor="motivation" className="facodi-label">
                {t('curator.apply.form.motivation')} *
              </label>
              <textarea
                id="motivation"
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                required
                rows={4}
                className="facodi-input resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="portfolioUrl" className="facodi-label">
                  {t('curator.apply.form.portfolioUrl')}
                </label>
                <input
                  id="portfolioUrl"
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  className="facodi-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="relevantLinks" className="facodi-label">
                {t('curator.apply.form.relevantLinks')}
              </label>
              <textarea
                id="relevantLinks"
                name="relevantLinks"
                value={formData.relevantLinks}
                onChange={handleChange}
                placeholder={locale === 'pt' ? 'Uma URL por linha' : 'One URL per line'}
                rows={3}
                className="facodi-input resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="guidelinesAccepted"
                  checked={formData.guidelinesAccepted}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-slate-700">
                  {t('curator.apply.form.guidelinesAccepted')} *
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="consentPrivacy"
                  checked={formData.consentPrivacy}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-slate-700">
                  {t('curator.apply.form.consentPrivacy')} *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="facodi-btn facodi-btn-primary facodi-btn-full"
            >
              {submitting ? t('curator.apply.form.submitting') : t('curator.apply.form.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
