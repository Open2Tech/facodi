import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

type ProjectPage = 'about' | 'community';

const localeMap: Record<string, string> = {
  pt: 'pt_PT',
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
};

/** Canonical project pages: no fabricated locales or member identity metadata. */
export default function ProjectPageSeo({ page }: { page: ProjectPage }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language.split('-')[0].toLowerCase();
  const canonical = `https://facodi.vercel.app/${page}`;
  const title = t(`projectSeo.${page}.title`);
  const description = t(`projectSeo.${page}.description`);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': page === 'about' ? 'AboutPage' : 'WebPage',
    name: title,
    description,
    url: canonical,
    inLanguage: language,
    isPartOf: {
      '@type': 'WebSite',
      name: 'FACODI',
      url: 'https://facodi.vercel.app/',
    },
  };
  return <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="FACODI" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:locale" content={localeMap[language] ?? 'pt_PT'} />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
  </Helmet>;
}
