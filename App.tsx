
import React, { Suspense, useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import CourseCard from './components/CourseCard';
import PlaylistCard from './components/PlaylistCard';
import Courses from './components/Courses';
import { Category, Course, CurricularUnit, FilterState, Playlist } from './types';
import { CatalogSource, loadCatalogData } from './services/catalogSource';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabase';
import RequireAuth from './components/auth/RequireAuth';
import PermissionDenied from './components/auth/PermissionDenied';
import SEOHead from './components/SEOHead';
import { getPostBySlug } from './data/blogPosts';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const CourseDetail = React.lazy(() => import('./components/CourseDetail'));
const Contributors = React.lazy(() => import('./components/Contributors'));
const LessonDetail = React.lazy(() => import('./components/LessonDetail'));
const InstitutionalPage = React.lazy(() => import('./components/InstitutionalPage'));
const AINavigator = React.lazy(() => import('./components/AINavigator'));
const VideoDetail = React.lazy(() => import('./components/videos/VideoDetail'));
const AuthModal = React.lazy(() => import('./components/auth/AuthModal'));
const ProfilePage = React.lazy(() => import('./components/user/ProfilePage'));
const StudentDashboard = React.lazy(() => import('./components/student/StudentDashboard'));
const StudentMyCoursesPage = React.lazy(() => import('./components/student/StudentMyCoursesPage'));
const StudentProgressPage = React.lazy(() => import('./components/student/StudentProgressPage'));
const StudentHistoryPage = React.lazy(() => import('./components/student/StudentHistoryPage'));
const CuratorApplicationPage = React.lazy(() => import('./components/curator/CuratorApplicationPage').then(m => ({ default: m.CuratorApplicationPage })));
const ContentSubmissionPage = React.lazy(() => import('./components/curator/ContentSubmissionPage').then(m => ({ default: m.ContentSubmissionPage })));
const SubmissionListPage = React.lazy(() => import('./components/curator/SubmissionListPage').then(m => ({ default: m.SubmissionListPage })));
const AdminReviewDashboard = React.lazy(() => import('./components/curator/AdminReviewDashboard').then(m => ({ default: m.AdminReviewDashboard })));
const ChannelCurationPage = React.lazy(() => import('./components/ChannelCurationPage'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const AdminContentListPage = React.lazy(() => import('./components/admin/AdminContentListPage'));
const AdminContentDetailPage = React.lazy(() => import('./components/admin/AdminContentDetailPage'));
const AdminCuratorListPage = React.lazy(() => import('./components/admin/AdminCuratorListPage'));
const BlogListPage = React.lazy(() => import('./components/blog/BlogListPage'));
const BlogPostPage = React.lazy(() => import('./components/blog/BlogPostPage'));

type View =
  | 'home'
  | 'not-found'
  | 'courses'
  | 'repository'
  | 'paths'
  | 'contributors'
  | 'course-detail'
  | 'lesson-detail'
  | 'playlists'
  | 'dashboard'
  | 'institutional-page'
  | 'videos'
  | 'video-detail'
  | 'profile'
  | 'student-dashboard'
  | 'student-my-courses'
  | 'student-progress'
  | 'student-history'
  | 'curator-apply'
  | 'curator-submit'
  | 'curator-submissions'
  | 'curator-channel-pipeline'
  | 'curator-admin-review'
  | 'curator-channel-curation'
  | 'admin-dashboard'
  | 'admin-contents'
  | 'admin-content-detail'
  | 'admin-curators'
  | 'blog'
  | 'blog-post';

const App: React.FC = () => {
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [savedUnitIds, setSavedUnitIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedAdminSubmissionId, setSelectedAdminSubmissionId] = useState<string | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>('pt');
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<CurricularUnit[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('mock');
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [enableAiNavigator, setEnableAiNavigator] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    difficulty: 'All',
    search: '',
    onlySaved: false,
    courseId: 'All',
    year: 'All',
    semester: 'All'
  });

  const updateRoute = (view: View, unitId?: string | null, lessonId?: string | null, videoId?: string | null, blogSlug?: string | null) => {
    let path = '/';
    if (view === 'courses') path = '/courses';
    if (view === 'repository') path = '/courses/units';
    if (view === 'course-detail' && unitId) path = `/courses/units/${unitId}`;
    if (view === 'lesson-detail' && lessonId) path = `/lessons/${lessonId}`;
    if (view === 'videos') path = '/videos';
    if (view === 'video-detail' && videoId) path = `/videos/${videoId}`;
    if (view === 'dashboard') path = '/dashboard';
    if (view === 'playlists') path = '/playlists';
    if (view === 'contributors') path = '/contributors';
    if (view === 'profile') path = '/profile';
    if (view === 'institutional-page' && unitId) path = `/${unitId}`;
    if (view === 'student-dashboard') path = '/student/dashboard';
    if (view === 'student-my-courses') path = '/student/my-courses';
    if (view === 'student-progress') path = '/student/progress';
    if (view === 'student-history') path = '/student/history';
    if (view === 'curator-apply') path = '/curator/apply';
    if (view === 'curator-submit') path = '/curator/submit';
    if (view === 'curator-submissions') path = '/curator/submissions';
    if (view === 'curator-channel-pipeline') path = '/curator/channel-pipeline';
    if (view === 'curator-admin-review') path = '/curator/admin-review';
    if (view === 'curator-channel-curation') path = '/curator/channel-curation';
    if (view === 'admin-dashboard') path = '/admin';
    if (view === 'admin-contents') path = '/admin/conteudos';
    if (view === 'admin-content-detail' && unitId) path = `/admin/conteudos/${unitId}`;
    if (view === 'admin-curators') path = '/admin/curadores';
    if (view === 'blog') path = '/blog';
    if (view === 'blog-post' && blogSlug) path = `/blog/${blogSlug}`;
    window.history.pushState({}, '', path);
  };

  const syncViewWithLocation = () => {
    const path = window.location.pathname;
    if (path.startsWith('/blog/')) {
      const blogSlug = path.replace('/blog/', '').split('/')[0];
      if (blogSlug) {
        setSelectedBlogSlug(blogSlug);
        setCurrentView('blog-post');
        return;
      }
    }
    if (path === '/blog') {
      setCurrentView('blog');
      return;
    }
    if (path.startsWith('/curator/')) {
      if (path === '/curator/apply') {
        setCurrentView('curator-apply');
        return;
      }
      if (path === '/curator/submit') {
        setCurrentView('curator-submit');
        return;
      }
      if (path === '/curator/submissions') {
        setCurrentView('curator-submissions');
        return;
      }
      if (path === '/curator/channel-pipeline') {
        setCurrentView('curator-channel-pipeline');
        return;
      }
      if (path === '/curator/admin-review') {
        setCurrentView('curator-admin-review');
        return;
      }
      if (path === '/curator/channel-curation') {
        setCurrentView('curator-channel-curation');
        return;
      }
    }
    if (path.startsWith('/admin')) {
      if (path === '/admin') {
        setCurrentView('admin-dashboard');
        return;
      }
      if (path === '/admin/conteudos') {
        setCurrentView('admin-contents');
        return;
      }
      if (path.startsWith('/admin/conteudos/')) {
        const submissionId = path.replace('/admin/conteudos/', '').split('/')[0];
        if (submissionId) {
          setSelectedAdminSubmissionId(submissionId);
          setCurrentView('admin-content-detail');
          return;
        }
      }
      if (path === '/admin/curadores') {
        setCurrentView('admin-curators');
        return;
      }
    }
    if (path.startsWith('/student/')) {
      if (path === '/student/dashboard') {
        setCurrentView('student-dashboard');
        return;
      }
      if (path === '/student/my-courses') {
        setCurrentView('student-my-courses');
        return;
      }
      if (path === '/student/progress') {
        setCurrentView('student-progress');
        return;
      }
      if (path === '/student/history') {
        setCurrentView('student-history');
        return;
      }
    }
    if (path.startsWith('/videos/')) {
      const videoId = path.replace('/videos/', '').split('/')[0];
      if (videoId) {
        setSelectedVideoId(videoId);
        setCurrentView('video-detail');
        return;
      }
    }
    if (path.startsWith('/videos')) {
      setCurrentView('videos');
      return;
    }
    if (path.startsWith('/lessons/')) {
      const lessonId = path.replace('/lessons/', '').split('/')[0];
      const lessonExists = units.some(unit => unit.id === lessonId);
      if (lessonExists) {
        setSelectedLessonId(lessonId);
        setCurrentView('lesson-detail');
        return;
      }
    }
    if (path.startsWith('/courses/units/')) {
      const unitId = path.replace('/courses/units/', '').split('/')[0];
      const unitExists = units.some(unit => unit.id === unitId);
      if (unitExists) {
        setSelectedUnitId(unitId);
        setCurrentView('course-detail');
        return;
      }
    }
    if (path.startsWith('/courses/units')) {
      setCurrentView('repository');
      return;
    }
    if (path.startsWith('/courses')) {
      setCurrentView('courses');
      return;
    }
    if (path.startsWith('/dashboard')) {
      setCurrentView('dashboard');
      return;
    }
    if (path.startsWith('/playlists')) {
      setCurrentView('playlists');
      return;
    }
    if (path.startsWith('/contributors')) {
      setCurrentView('contributors');
      return;
    }
    if (path === '/profile') {
      setCurrentView('profile');
      return;
    }
    // Institutional pages: /manifesto, /sobre, /comunidade, /roadmap, /infraestrutura, /como-contribuir
    const INSTITUTIONAL_SLUGS = ['manifesto', 'sobre', 'comunidade', 'roadmap', 'infraestrutura', 'como-contribuir', 'sobre-marcelo', 'sobre-ualg', 'sobre-open2', 'modelo-academico'];
    const slug = path.replace('/', '');
    if (INSTITUTIONAL_SLUGS.includes(slug)) {
      setSelectedPageSlug(slug);
      setCurrentView('institutional-page');
      return;
    }
    if (path === '/' || path === '') {
      setCurrentView('home');
      return;
    }
    setCurrentView('not-found');
  };

  useEffect(() => {
    let active = true;
    setIsCatalogLoading(true);

    loadCatalogData()
      .then((payload) => {
        if (!active) return;
        setCourses(payload.courses);
        setUnits(payload.units);
        setPlaylists(payload.playlists);
        setCatalogSource(payload.source);
        setCatalogError(null);
      })
      .catch((error) => {
        if (!active) return;
        setCatalogError(error instanceof Error ? error.message : 'Falha ao sincronizar conteudo do catalogo.');
        setCourses([]);
        setUnits([]);
        setPlaylists([]);
      })
      .finally(() => {
        if (!active) return;
        setIsCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    syncViewWithLocation();
    const handlePop = () => syncViewWithLocation();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [units]);

  useEffect(() => {
    const privateViews = new Set<View>([
      'dashboard',
      'student-dashboard',
      'student-my-courses',
      'student-progress',
      'student-history',
      'curator-apply',
      'curator-submit',
      'curator-submissions',
      'curator-channel-pipeline',
      'curator-admin-review',
      'admin-dashboard',
      'admin-contents',
      'admin-content-detail',
      'admin-curators',
    ]);

    if (!user && privateViews.has(currentView)) {
      setCurrentView('home');
      updateRoute('home');
    }
  }, [user, currentView]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedUnitId]);

  useEffect(() => {
    const saved = localStorage.getItem('facodi_saved');
    if (saved) setSavedUnitIds(JSON.parse(saved));
    const storedLocale = localStorage.getItem('facodi_locale');
    if (storedLocale === 'pt' || storedLocale === 'en') {
      setLocale(storedLocale);
    }

    // Ensure stale dark-mode settings are cleared.
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('bg-black', 'text-white');
    document.body.classList.add('bg-white', 'text-black');
    localStorage.removeItem('facodi_theme');
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-PT' : 'en-US';
    localStorage.setItem('facodi_locale', locale);
  }, [locale]);

  const seo = useMemo(() => {
    const rawSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://facodi.open2.tech';
    const siteUrl = rawSiteUrl.endsWith('/') ? rawSiteUrl.slice(0, -1) : rawSiteUrl;
    const defaultImage = `${siteUrl}/og/facodi-preview.svg`;
    const defaultDescription = 'Plataforma aberta e comunitaria de educacao digital que organiza cursos, unidades curriculares, playlists e conteudos publicos para apoiar percursos de aprendizagem acessiveis.';
    const selectedUnitForSeo = units.find((u) => u.id === selectedUnitId) || null;
    const selectedLessonForSeo = units.find((u) => u.id === selectedLessonId) || null;
    const selectedPost = selectedBlogSlug ? getPostBySlug(selectedBlogSlug) : undefined;
    const privateViews = new Set<View>([
      'dashboard',
      'profile',
      'student-dashboard',
      'student-my-courses',
      'student-progress',
      'student-history',
      'curator-apply',
      'curator-submit',
      'curator-submissions',
      'curator-channel-pipeline',
      'curator-admin-review',
      'admin-dashboard',
      'admin-contents',
      'admin-content-detail',
      'admin-curators',
    ]);

    let path = '/';
    let title = 'FACODI - Faculdade Comunitaria Digital';
    let description = defaultDescription;
    let type: 'website' | 'article' = 'website';
    let image = defaultImage;
    let structuredData: Record<string, unknown> | Array<Record<string, unknown>> | undefined = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'FACODI - Faculdade Comunitaria Digital',
        url: siteUrl,
        description: defaultDescription,
        inLanguage: locale === 'pt' ? 'pt-PT' : 'en-US',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'FACODI - Faculdade Comunitaria Digital',
        url: siteUrl,
        description: defaultDescription,
      },
    ];

    if (currentView === 'courses') {
      path = '/courses';
      title = 'Cursos abertos | FACODI';
      description = 'Explore cursos abertos organizados por unidades curriculares, trilhas de estudo e conteudos educacionais selecionados pela comunidade FACODI.';
    } else if (currentView === 'repository') {
      path = '/courses/units';
      title = 'Unidades curriculares | FACODI';
      description = 'Navegue por unidades curriculares com objetivos, conteudos e playlists para estudo aberto e digital.';
    } else if (currentView === 'course-detail') {
      path = selectedUnitForSeo ? `/courses/units/${selectedUnitForSeo.id}` : '/courses/units';
      title = selectedUnitForSeo ? `${selectedUnitForSeo.name} | FACODI` : 'Unidade curricular | FACODI';
      description = selectedUnitForSeo ? `Acesse conteudos, videos e materiais organizados para estudar ${selectedUnitForSeo.name} no FACODI.` : defaultDescription;
      structuredData = selectedUnitForSeo
        ? {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: selectedUnitForSeo.name,
            description,
            provider: {
              '@type': 'EducationalOrganization',
              name: 'FACODI',
              sameAs: siteUrl,
            },
          }
        : structuredData;
    } else if (currentView === 'lesson-detail') {
      path = selectedLessonForSeo ? `/lessons/${selectedLessonForSeo.id}` : '/courses/units';
      title = selectedLessonForSeo ? `${selectedLessonForSeo.name} | FACODI` : 'Licao | FACODI';
      description = selectedLessonForSeo ? `Acesse conteudos, videos e materiais organizados para estudar ${selectedLessonForSeo.name} no FACODI.` : defaultDescription;
    } else if (currentView === 'contributors') {
      path = '/contributors';
      title = 'Contribuidores | FACODI';
      description = 'Conheca pessoas e comunidades que fortalecem a aprendizagem aberta e colaborativa na FACODI.';
    } else if (currentView === 'playlists') {
      path = '/playlists';
      title = 'Playlists educacionais | FACODI';
      description = 'Descubra playlists educacionais curadas para apoiar trilhas de estudo e aprendizagem aberta.';
    } else if (currentView === 'videos') {
      path = '/videos';
      title = 'Videos educacionais | FACODI';
      description = 'Explore videos educacionais relacionados a unidades curriculares e percursos de aprendizagem.';
    } else if (currentView === 'video-detail') {
      path = selectedVideoId ? `/videos/${selectedVideoId}` : '/videos';
      title = selectedVideoId ? `Video ${selectedVideoId} | FACODI` : 'Video | FACODI';
      description = 'Pagina de video educacional com contexto curricular e navegacao relacionada.';
    } else if (currentView === 'institutional-page') {
      const slugMeta: Record<string, { title: string; description: string }> = {
        manifesto: {
          title: 'Manifesto | FACODI',
          description: 'Conheca a visao da FACODI para uma educacao digital aberta, comunitaria e acessivel.',
        },
        sobre: {
          title: 'Sobre o projeto | FACODI',
          description: 'Conheca o FACODI, iniciativa de educacao digital aberta e comunitaria ligada ao contexto SEA-EU Student-Led Projects 2026 e Universidade do Algarve.',
        },
        'sobre-marcelo': {
          title: 'Sobre Marcelo Santos | FACODI',
          description: 'Conheca a lideranca e a visao por tras do projeto FACODI.',
        },
        'sobre-ualg': {
          title: 'Universidade do Algarve | FACODI',
          description: 'Contexto institucional e colaborativo entre FACODI e Universidade do Algarve.',
        },
        'sobre-open2': {
          title: 'Open2 Technology | FACODI',
          description: 'Conheca a contribuicao da Open2 Technology na evolucao da plataforma FACODI.',
        },
        comunidade: {
          title: 'Comunidade academica | FACODI',
          description: 'Participe da comunidade academica e colaborativa que constroi trilhas de aprendizagem abertas no FACODI.',
        },
        roadmap: {
          title: 'Roadmap | FACODI',
          description: 'Veja os proximos passos da plataforma FACODI para educacao aberta e curadoria comunitaria.',
        },
        infraestrutura: {
          title: 'Infraestrutura | FACODI',
          description: 'Entenda a base tecnica da plataforma FACODI para ensino aberto e digital.',
        },
        'como-contribuir': {
          title: 'Curadoria de conteudo | FACODI',
          description: 'Candidate-se ou contribua com conteudos educacionais para fortalecer trilhas de estudo abertas e comunitarias no FACODI.',
        },
        'modelo-academico': {
          title: 'Modelo academico | FACODI',
          description: 'Entenda como cursos, unidades curriculares e playlists estruturam percursos abertos de aprendizagem.',
        },
      };
      path = selectedPageSlug ? `/${selectedPageSlug}` : '/';
      title = selectedPageSlug ? (slugMeta[selectedPageSlug]?.title || 'Institucional | FACODI') : title;
      description = selectedPageSlug ? (slugMeta[selectedPageSlug]?.description || defaultDescription) : description;
    } else if (currentView === 'blog') {
      path = '/blog';
      title = 'Blog | FACODI';
      description = 'Artigos sobre educacao aberta, aprendizagem digital, curadoria de conteudos e inovacao comunitaria no FACODI.';
    } else if (currentView === 'blog-post') {
      path = selectedBlogSlug ? `/blog/${selectedBlogSlug}` : '/blog';
      title = selectedPost ? `${selectedPost.title} | Blog FACODI` : 'Artigo | Blog FACODI';
      description = selectedPost?.excerpt || 'Leitura de artigo do blog FACODI sobre educacao aberta e tecnologia comunitaria.';
      type = 'article';
      structuredData = selectedPost
        ? {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: selectedPost.title,
            description: selectedPost.excerpt,
            datePublished: selectedPost.date,
            author: {
              '@type': 'Person',
              name: selectedPost.author,
            },
            keywords: selectedPost.tags,
            mainEntityOfPage: `${siteUrl}${path}`,
          }
        : undefined;
    } else if (currentView === 'dashboard') {
      path = '/dashboard';
      title = 'Meu progresso | FACODI';
      description = 'Area pessoal para acompanhar progresso de aprendizagem no FACODI.';
    } else if (currentView === 'student-dashboard') {
      path = '/student/dashboard';
      title = 'Area do estudante | FACODI';
      description = 'Painel privado para acompanhar cursos e progresso.';
    } else if (currentView === 'student-my-courses') {
      path = '/student/my-courses';
      title = 'Meus cursos | FACODI';
      description = 'Area privada com matriculas e andamento de estudos.';
    } else if (currentView === 'student-progress') {
      path = '/student/progress';
      title = 'Meu progresso | FACODI';
      description = 'Area privada com relatorio de progresso.';
    } else if (currentView === 'student-history') {
      path = '/student/history';
      title = 'Meu historico | FACODI';
      description = 'Area privada com historico de atividades.';
    } else if (currentView === 'profile') {
      path = '/profile';
      title = 'Meu perfil | FACODI';
      description = 'Area privada com informacoes do perfil do utilizador.';
    } else if (currentView === 'curator-apply') {
      path = '/curator/apply';
      title = 'Candidatura de curador | FACODI';
      description = 'Area privada para candidatura de curadoria de conteudo.';
    } else if (currentView === 'curator-submit') {
      path = '/curator/submit';
      title = 'Enviar conteudo | FACODI';
      description = 'Area privada para submissao de conteudo educacional.';
    } else if (currentView === 'curator-submissions') {
      path = '/curator/submissions';
      title = 'Minhas submissoes | FACODI';
      description = 'Area privada para acompanhar o status das submissoes.';
    } else if (currentView === 'curator-channel-pipeline') {
      path = '/curator/channel-pipeline';
      title = 'Pipeline de curadoria por canal | FACODI';
      description = 'Area editorial privada para importar canais do YouTube, analisar videos com IA e publicar no fluxo atual de revisao.';
    } else if (currentView === 'curator-admin-review') {
      path = '/curator/admin-review';
      title = 'Revisao administrativa | FACODI';
      description = 'Area administrativa privada de revisao de conteudo.';
    } else if (currentView === 'admin-dashboard') {
      path = '/admin';
      title = 'Painel admin | FACODI';
      description = 'Area administrativa privada do FACODI.';
    } else if (currentView === 'admin-contents') {
      path = '/admin/conteudos';
      title = 'Revisao de conteudos | FACODI';
      description = 'Area administrativa privada para moderacao de conteudos.';
    } else if (currentView === 'admin-content-detail') {
      path = selectedAdminSubmissionId ? `/admin/conteudos/${selectedAdminSubmissionId}` : '/admin/conteudos';
      title = 'Conteudo em revisao | FACODI';
      description = 'Area administrativa privada com detalhes de revisao de conteudo.';
    } else if (currentView === 'admin-curators') {
      path = '/admin/curadores';
      title = 'Curadores | FACODI';
      description = 'Area administrativa privada para avaliacao de curadores.';
    }

    return {
      title,
      description,
      canonical: `${siteUrl}${path}`,
      image,
      type,
      noindex: privateViews.has(currentView),
      locale: locale === 'pt' ? 'pt_PT' : 'en_US',
      structuredData,
    };
  }, [
    currentView,
    locale,
    selectedAdminSubmissionId,
    selectedBlogSlug,
    selectedLessonId,
    selectedPageSlug,
    selectedUnitId,
    selectedVideoId,
    units,
  ]);

  useEffect(() => {
    let timeoutId: number | null = null;
    const schedule = () => setEnableAiNavigator(true);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(schedule);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    timeoutId = window.setTimeout(schedule, 900);
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const lazyFallback = (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
      <div className="stark-border bg-brand-muted p-6 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3">
        <span className="material-symbols-outlined animate-pulse">hourglass_top</span>
        A carregar...
      </div>
    </div>
  );

  const toggleSave = (id: string) => {
    const newSaved = savedUnitIds.includes(id)
      ? savedUnitIds.filter(sid => sid !== id)
      : [...savedUnitIds, id];
    setSavedUnitIds(newSaved);
    localStorage.setItem('facodi_saved', JSON.stringify(newSaved));

    // Sync to Supabase if logged in (unit_code = id for mock source, or unitCode field)
    if (user) {
      const unitCode = units.find(u => u.id === id)?.unitCode ?? id;
      if (newSaved.includes(id)) {
        supabase.from('unit_favorites').upsert({ user_id: user.id, unit_code: unitCode }, { onConflict: 'user_id,unit_code' }).then(({ error }) => {
          if (error) console.warn('[toggleSave] upsert error:', error.message);
        });
      } else {
        supabase.from('unit_favorites').delete().eq('user_id', user.id).eq('unit_code', unitCode).then(({ error }) => {
          if (error) console.warn('[toggleSave] delete error:', error.message);
        });
      }
    }
  };

  const categories = ['All', ...Object.values(Category)];
  const years = ['All', 1, 2, 3];
  const semesters = ['All', 1, 2, 3, 4, 5, 6];

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId) || null, [selectedUnitId, units]);
  const savedUnits = useMemo(() => units.filter(u => savedUnitIds.includes(u.id)), [savedUnitIds, units]);
  const selectedLesson = useMemo(() => units.find(u => u.id === selectedLessonId) || null, [selectedLessonId, units]);
  const coursesById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const selectedCourse = useMemo(
    () => (filters.courseId === 'All' ? null : (coursesById.get(filters.courseId) ?? null)),
    [filters.courseId, coursesById],
  );

  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const matchesSearch = unit.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                          unit.tags.some(t => t.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesCategory = filters.category === 'All' || unit.category === filters.category;
      const matchesDifficulty = filters.difficulty === 'All' || unit.difficulty === filters.difficulty;
      const matchesSaved = !filters.onlySaved || savedUnitIds.includes(unit.id);
      const matchesCourse = filters.courseId === 'All' || unit.courseId === filters.courseId;
      const matchesYear = filters.year === 'All' || unit.year === Number(filters.year);
      const matchesSemester = filters.semester === 'All' || unit.semester === Number(filters.semester);
      return matchesSearch && matchesCategory && matchesDifficulty && matchesSaved && matchesCourse && matchesYear && matchesSemester;
    });
  }, [filters, savedUnitIds, units]);

  const clearFilters = () => {
    setFilters({ category: 'All', difficulty: 'All', search: '', onlySaved: false, courseId: 'All', year: 'All', semester: 'All' });
  };

  const handleUnitSelect = (id: string) => {
    setSelectedUnitId(id);
    setCurrentView('course-detail');
    updateRoute('course-detail', id);
  };

  const handleLessonSelect = (id: string) => {
    setSelectedLessonId(id);
    setCurrentView('lesson-detail');
    updateRoute('lesson-detail', undefined, id);
  };

  const handlePageNavigate = (slug: string) => {
    setSelectedPageSlug(slug);
    setCurrentView('institutional-page');
    updateRoute('institutional-page', slug);
  };

  const handleVideoSelect = (id: string) => {
    setSelectedVideoId(id);
    setCurrentView('video-detail');
    updateRoute('video-detail', undefined, undefined, id);
  };

  const handleAdminSubmissionSelect = (id: string) => {
    setSelectedAdminSubmissionId(id);
    setCurrentView('admin-content-detail');
    updateRoute('admin-content-detail', id);
  };

  const handleBlogSelect = (slug: string) => {
    setSelectedBlogSlug(slug);
    setCurrentView('blog-post');
    updateRoute('blog-post', undefined, undefined, undefined, slug);
  };

  const renderContent = () => {
    if (currentView === 'blog') {
      return (
        <Suspense fallback={lazyFallback}>
          <BlogListPage locale={locale} onSelectPost={handleBlogSelect} />
        </Suspense>
      );
    }

    if (currentView === 'blog-post' && selectedBlogSlug) {
      return (
        <Suspense fallback={lazyFallback}>
          <BlogPostPage
            slug={selectedBlogSlug}
            locale={locale}
            onBack={() => {
              setCurrentView('blog');
              updateRoute('blog');
            }}
          />
        </Suspense>
      );
    }

    if (currentView === 'curator-apply') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <CuratorApplicationPage locale={locale} />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'curator-submit') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <ContentSubmissionPage locale={locale} />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'curator-submissions') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <SubmissionListPage locale={locale} />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'curator-channel-pipeline') {
      if (!user) {
        return <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>{null}</RequireAuth>;
      }
      if (profile?.role !== 'editor' && profile?.role !== 'admin') {
        return <PermissionDenied onBack={() => { setCurrentView('home'); updateRoute('home'); }} requiredRole="Editor ou Administrador" />;
      }
      return (
        <Suspense fallback={lazyFallback}>
          <ChannelCurationPage locale={locale} />
        </Suspense>
      );
    }

    if (currentView === 'curator-admin-review') {
      if (!user) {
        return <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>{null}</RequireAuth>;
      }
      if (profile?.role !== 'admin') {
        return <PermissionDenied onBack={() => { setCurrentView('home'); updateRoute('home'); }} requiredRole="Administrador" />;
      }
      return (
        <Suspense fallback={lazyFallback}>
          <AdminReviewDashboard locale={locale} />
        </Suspense>
      );
    }

    if (currentView === 'curator-channel-curation') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <ChannelCurationPage locale={locale} />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'admin-dashboard') {
      if (!user) {
        return <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>{null}</RequireAuth>;
      }
      if (profile?.role !== 'admin') {
        return <PermissionDenied onBack={() => { setCurrentView('home'); updateRoute('home'); }} requiredRole="Administrador" />;
      }
      return (
        <Suspense fallback={lazyFallback}>
          <AdminDashboard
            onBack={() => { setCurrentView('home'); updateRoute('home'); }}
            onNavigate={(view) => {
              if (view === 'admin-contents') {
                setCurrentView('admin-contents');
                updateRoute('admin-contents');
              } else if (view === 'admin-curators') {
                setCurrentView('admin-curators');
                updateRoute('admin-curators');
              } else {
                setCurrentView('curator-admin-review');
                updateRoute('curator-admin-review');
              }
            }}
          />
        </Suspense>
      );
    }

    if (currentView === 'admin-contents') {
      if (!user) {
        return <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>{null}</RequireAuth>;
      }
      if (profile?.role !== 'admin') {
        return <PermissionDenied onBack={() => { setCurrentView('home'); updateRoute('home'); }} requiredRole="Administrador" />;
      }
      return (
        <Suspense fallback={lazyFallback}>
          <AdminContentListPage
            onBack={() => { setCurrentView('admin-dashboard'); updateRoute('admin-dashboard'); }}
            onOpenSubmission={handleAdminSubmissionSelect}
          />
        </Suspense>
      );
    }

    if (currentView === 'admin-content-detail' && selectedAdminSubmissionId) {
      if (!user) {
        return <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>{null}</RequireAuth>;
      }
      if (profile?.role !== 'admin') {
        return <PermissionDenied onBack={() => { setCurrentView('home'); updateRoute('home'); }} requiredRole="Administrador" />;
      }
      return (
        <Suspense fallback={lazyFallback}>
          <AdminContentDetailPage
            submissionId={selectedAdminSubmissionId}
            onBack={() => { setCurrentView('admin-contents'); updateRoute('admin-contents'); }}
          />
        </Suspense>
      );
    }

    if (currentView === 'admin-curators') {
      if (!user) {
        return <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>{null}</RequireAuth>;
      }
      if (profile?.role !== 'admin') {
        return <PermissionDenied onBack={() => { setCurrentView('home'); updateRoute('home'); }} requiredRole="Administrador" />;
      }
      return (
        <Suspense fallback={lazyFallback}>
          <AdminCuratorListPage
            onBack={() => { setCurrentView('admin-dashboard'); updateRoute('admin-dashboard'); }}
          />
        </Suspense>
      );
    }

    if (currentView === 'profile') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <ProfilePage
              onBack={() => { setCurrentView('home'); updateRoute('home'); }}
            />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'not-found') {
      return (
        <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="stark-border p-10 bg-brand-muted">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-500 mb-4">404</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Página não encontrada</h2>
            <p className="text-sm text-gray-600 mb-8">A rota solicitada não existe ou foi movida.</p>
            <button
              onClick={() => {
                setCurrentView('home');
                updateRoute('home');
              }}
              className="bg-primary text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Voltar ao início
            </button>
          </div>
        </section>
      );
    }

    if (currentView === 'student-dashboard') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <StudentDashboard
              onBack={() => { setCurrentView('home'); updateRoute('home'); }}
              onSelectCourse={handleUnitSelect}
              onSelectVideo={handleVideoSelect}
            />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'student-my-courses') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <StudentMyCoursesPage
              onBack={() => { setCurrentView('home'); updateRoute('home'); }}
              onSelectCourse={handleUnitSelect}
            />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'student-progress') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <StudentProgressPage
              onBack={() => { setCurrentView('home'); updateRoute('home'); }}
            />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'student-history') {
      return (
        <Suspense fallback={lazyFallback}>
          <RequireAuth onOpenAuth={() => setShowAuthModal(true)}>
            <StudentHistoryPage
              onBack={() => { setCurrentView('home'); updateRoute('home'); }}
            />
          </RequireAuth>
        </Suspense>
      );
    }

    if (currentView === 'course-detail' && selectedUnit) {
      return (
        <Suspense fallback={lazyFallback}>
          <CourseDetail
            unit={selectedUnit}
            allUnits={units}
            playlists={playlists}
            onBack={() => {
              setCurrentView('repository');
              updateRoute('repository');
            }}
            onNavigate={handleUnitSelect}
            courseTitle={coursesById.get(selectedUnit.courseId)?.title}
          />
        </Suspense>
      );
    }

    if (currentView === 'institutional-page' && selectedPageSlug) {
      return (
        <Suspense fallback={lazyFallback}>
          <InstitutionalPage
            slug={selectedPageSlug}
            locale={locale}
            onBack={() => {
              setCurrentView('home');
              updateRoute('home');
            }}
          />
        </Suspense>
      );
    }

    if (currentView === 'lesson-detail' && selectedLesson) {
      return (
        <Suspense fallback={lazyFallback}>
          <LessonDetail
            unit={selectedLesson}
            allUnits={units}
            playlists={playlists}
            onBack={() => {
              setCurrentView('repository');
              updateRoute('repository');
            }}
            onNavigate={handleLessonSelect}
            courseTitle={coursesById.get(selectedLesson.courseId)?.title}
          />
        </Suspense>
      );
    }

    if (currentView === 'video-detail' && selectedVideoId) {
      return (
        <Suspense fallback={lazyFallback}>
          <VideoDetail
            videoId={selectedVideoId}
            onBack={() => {
              setCurrentView('videos');
              updateRoute('videos');
            }}
            onSelectVideo={handleVideoSelect}
          />
        </Suspense>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Suspense fallback={lazyFallback}>
            <Dashboard
              savedUnits={savedUnits}
              onUnitClick={handleUnitSelect}
              onRemove={toggleSave}
            />
          </Suspense>
        );
      case 'home':
        return (
          <Home
            onExplore={() => {
              setCurrentView('courses');
              updateRoute('courses');
            }}
            onNavigatePage={handlePageNavigate}
            onSelectCourse={(courseId) => {
              setFilters((f) => ({ ...f, courseId }));
              setCurrentView('repository');
              updateRoute('repository');
            }}
            courses={courses}
            units={units}
          />
        );
      case 'courses':
        return (
          <Courses
            onSelectCourse={(courseId) => {
              setFilters(f => ({ ...f, courseId }));
              setCurrentView('repository');
              updateRoute('repository');
            }}
            courses={courses}
            units={units}
            isLoading={isCatalogLoading}
          />
        );
      case 'contributors':
        return (
          <Suspense fallback={lazyFallback}>
            <Contributors />
          </Suspense>
        );
      case 'playlists':
        return (
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">Playlists</h1>
            {catalogError && (
              <p className="text-xs uppercase tracking-widest text-red-600 mb-8">{catalogError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} onSelect={() => {}} />)}
            </div>
            {!playlists.length && (
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-10">Sem playlists mapeadas no conteudo sincronizado.</p>
            )}
          </div>
        );
      case 'repository':
      default:
        return (
          <>
            <section className="bg-white stark-border-b">
              <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 lg:gap-24">
                  <div className="max-w-3xl">
                    <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85] mb-8">Unidades</h1>
                    <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
                      Explore {units.length} unidades de conhecimento.
                      <span className="ml-2 text-xs uppercase tracking-widest text-gray-400">Fonte: {catalogSource}</span>
                    </p>
                    {selectedCourse && (
                      <div className="mt-8 stark-border bg-brand-muted p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3">Curso selecionado</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{selectedCourse.title}</h2>
                        <p className="text-xs text-gray-600 mt-2">
                          {filteredUnits.length} unidades associadas a {selectedCourse.id}.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="w-full lg:w-[480px] relative group">
                    <label htmlFor="units-search" className="sr-only">Pesquisar unidades curriculares</label>
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-black text-2xl group-focus-within:text-primary transition-colors">search</span>
                    <input
                      id="units-search"
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      className="w-full bg-white stark-border px-14 py-5 text-sm font-bold uppercase tracking-widest outline-none transition-all focus:shadow-[6px_6px_0px_0px_rgba(239,255,0,1)]"
                      placeholder="PESQUISAR..."
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
              <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
                <aside className="w-full lg:w-72 shrink-0 space-y-12">
                  <div className="sticky top-32 space-y-12">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">Curso</h3>
                      <div className="flex flex-wrap lg:flex-col gap-1">
                        <button onClick={() => setFilters(f => ({ ...f, courseId: 'All' }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.courseId === 'All' ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>Todos</button>
                        {courses.map(d => <button key={d.id} onClick={() => setFilters(f => ({ ...f, courseId: d.id }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.courseId === d.id ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>{d.id}</button>)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">Ano / Semestre</h3>
                      <div className="flex gap-4 mb-4">
                        <select value={filters.year} onChange={(e) => setFilters(f => ({ ...f, year: e.target.value as any }))} className="bg-white stark-border text-[10px] font-black p-2 w-full uppercase cursor-pointer">
                          {years.map(y => <option key={y} value={y}>{y === 'All' ? 'Ano' : `Ano ${y}`}</option>)}
                        </select>
                        <select value={filters.semester} onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value as any }))} className="bg-white stark-border text-[10px] font-black p-2 w-full uppercase cursor-pointer">
                          {semesters.map(s => <option key={s} value={s}>{s === 'All' ? 'Sem' : `S0${s}`}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">Área</h3>
                      <div className="flex flex-wrap lg:flex-col gap-1">
                        {categories.map(cat => <button key={cat} onClick={() => setFilters(f => ({ ...f, category: cat as any }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.category === cat ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>{cat}</button>)}
                      </div>
                    </div>
                    <button onClick={clearFilters} className="w-full stark-border py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">Limpar Filtros</button>
                  </div>
                </aside>

                <section className="flex-1">
                  {filteredUnits.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {filteredUnits.map(unit => (
                        <div key={unit.id} className="relative group">
                           <button 
                            onClick={(e) => { e.stopPropagation(); toggleSave(unit.id); }}
                            className={`absolute top-10 right-10 z-10 p-2 transition-all ${savedUnitIds.includes(unit.id) ? 'text-primary' : 'text-gray-300 hover:text-black'}`}
                            title={savedUnitIds.includes(unit.id) ? "Remover dos guardados" : "Guardar no progresso"}
                          >
                            <span className="material-symbols-outlined text-2xl">{savedUnitIds.includes(unit.id) ? 'bookmark' : 'bookmark_add'}</span>
                          </button>
                          <CourseCard
                            unit={unit}
                            onClick={handleLessonSelect}
                            courseTitle={coursesById.get(unit.courseId)?.title}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="stark-border bg-brand-muted p-20 text-center">
                      <p className="text-xl font-bold uppercase tracking-tight mb-4 opacity-40">Nenhum resultado nos nós de dados.</p>
                      <button onClick={clearFilters} className="text-white bg-black px-10 py-4 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-black transition-all">Resetar Filtros</button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
        image={seo.image}
        type={seo.type}
        noindex={seo.noindex}
        locale={seo.locale}
        structuredData={seo.structuredData}
      />
      <Layout
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          updateRoute(view);
        }}
        onNavigatePage={handlePageNavigate}
        savedCount={savedUnitIds.length}
        locale={locale}
        onLocaleChange={setLocale}
        t={t}
        onOpenAuth={() => setShowAuthModal(true)}
      >
        {renderContent()}
        {showAuthModal && (
          <Suspense fallback={null}>
            <AuthModal onClose={() => setShowAuthModal(false)} />
          </Suspense>
        )}
        {enableAiNavigator && (
          <Suspense fallback={null}>
            <AINavigator units={units} />
          </Suspense>
        )}
      </Layout>
    </>
  );
};

export default App;
