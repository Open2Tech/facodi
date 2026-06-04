import React, { useEffect, useState } from 'react';
import { ContentPage } from '../types';
import { loadContentPage } from '../services/contentSource';
import MarkdownView from './MarkdownView';

interface Props {
  slug: string;
  locale?: string;
  t?: (key: string) => string;
  onBack?: () => void;
}

// Hardcoded institutional content for 'sobre' slug
const INSTITUTIONAL_CONTENT_PT = `## Sobre o FACODI

O FACODI — Faculdade Comunitária Digital nasceu para aproximar pessoas, comunidades e conhecimento. A plataforma organiza currículos, unidades curriculares, playlists educacionais e materiais públicos em trilhas de estudo acessíveis, permitindo que estudantes explorem conteúdos de forma estruturada e que curadores contribuam para a construção coletiva do conhecimento.

## Reconhecimento institucional

O projeto "Digital Learning and Skills Recognition Platform for the SEA-EU Alliance / FACODI - Digital Community College" foi selecionado para financiamento na chamada SEA-EU Student-Led Projects 2026. A seleção reforça o potencial do FACODI como iniciativa de educação digital aberta, conectada à colaboração universitária europeia e ao desenvolvimento de novas formas de reconhecimento de competências.

## Ligação com a Universidade do Algarve

A iniciativa tem liderança de **Marcelo Souza Santos**, associado à Universidade do Algarve, instituição responsável pelo enquadramento financeiro do projeto no âmbito da chamada SEA-EU. Esta ligação fortalece o compromisso do FACODI com inovação educacional, participação estudantil e impacto comunitário.

Conheça mais sobre Marcelo: [LinkedIn](https://linkedin.com/in/marcelo-m7) | [GitHub](https://github.com/marcelo-m7)

## O que o FACODI pretende construir

- Trilhas de estudo abertas baseadas em currículos e unidades curriculares.
- Curadoria comunitária de vídeos, artigos e materiais educacionais.
- Ferramentas para acompanhar progresso, cursos inscritos e conteúdos assistidos.
- Fluxos de candidatura para curadores de conteúdo.
- Base futura para reconhecimento de competências e percursos formativos.
- Integração entre aprendizagem aberta, tecnologia e colaboração universitária.

## SEA-EU e colaboração europeia

A SEA-EU Alliance promove colaboração entre universidades europeias, mobilidade, participação estudantil e projetos que conectam conhecimento, território e inovação. O FACODI se alinha a esse espírito ao propor uma plataforma digital aberta, comunitária e orientada à aprendizagem contínua.`;

const INSTITUTIONAL_CONTENT_EN = `## About FACODI

FACODI — Digital Community College was created to bring together people, communities, and knowledge. The platform organizes curricula, curricular units, educational playlists, and public materials into accessible study paths, enabling students to explore content in a structured way and allowing curators to contribute to collective knowledge building.

## Institutional recognition

The project "Digital Learning and Skills Recognition Platform for the SEA-EU Alliance / FACODI - Digital Community College" was selected for funding in the SEA-EU Student-Led Projects 2026 call. This selection reinforces FACODI's potential as an open digital education initiative, connected to European university collaboration and the development of new forms of skills recognition.

## Connection with the University of Algarve

The initiative is led by **Marcelo Souza Santos**, associated with the University of Algarve, the institution responsible for the project's financial framework within the SEA-EU call. This connection strengthens FACODI's commitment to educational innovation, student participation, and community impact.

Learn more about Marcelo: [LinkedIn](https://linkedin.com/in/marcelo-m7) | [GitHub](https://github.com/marcelo-m7)

## What FACODI aims to build

- Open study pathways based on curricula and curricular units.
- Community curation of videos, articles, and educational materials.
- Tools to track progress, enrolled courses, and watched content.
- Application flows for content curators.
- Foundation for future skills recognition and learning pathways.
- Integration between open learning, technology, and university collaboration.

## SEA-EU and European collaboration

The SEA-EU Alliance promotes collaboration among European universities, mobility, student participation, and projects that connect knowledge, territory, and innovation. FACODI aligns with this spirit by proposing an open, community-driven digital platform oriented toward lifelong learning.`;

// Local fallback content for legal/compliance pages.
// Served when Supabase is unreachable or during SSR. Canonical content lives in public.content_pages.
type LegalEntry = { titlePt: string; titleEn: string; bodyPt: string; bodyEn: string };
const LEGAL_CONTENT: Record<string, LegalEntry> = {
  privacidade: {
    titlePt: 'Política de Privacidade',
    titleEn: 'Privacy Policy',
    bodyPt: `# Política de Privacidade

**Última atualização: junho de 2026**

A FACODI respeita a sua privacidade e protege os seus dados em conformidade com o RGPD (Regulamento (UE) 2016/679).

## Responsável

Open2 Technology / Projeto FACODI — **Email**: facodi@open2.tech

## Dados que Tratamos

- Dados de conta (email, nome de utilizador)
- Dados de perfil opcionais (nome de apresentação, foto)
- Dados de atividade (cursos guardados, progresso)
- Dados técnicos anonimizados para segurança

## Base Legal

Execução de contrato (Art. 6.º, al. b) e interesse legítimo (Art. 6.º, al. f).

## Os Seus Direitos

Acesso, retificação, apagamento e portabilidade dos dados. Reclamação à CNPD.
Contacto: **facodi@open2.tech**

## Cookies

Utilizamos apenas cookies essenciais. Consulte a [Política de Cookies](/cookies).`,
    bodyEn: `# Privacy Policy

**Last updated: June 2026**

FACODI respects your privacy and complies with GDPR (Regulation (EU) 2016/679).

## Data Controller

Open2 Technology / FACODI Project — **Email**: facodi@open2.tech

## Your Rights

Access, rectification, erasure and portability. Contact: **facodi@open2.tech**

## Cookies

We use only essential cookies. See our [Cookie Policy](/cookies).`,
  },
  termos: {
    titlePt: 'Termos de Uso',
    titleEn: 'Terms of Use',
    bodyPt: `# Termos de Uso

**Última atualização: junho de 2026**

Ao utilizar a FACODI, aceita estes Termos.

## O que é a FACODI

Plataforma educacional aberta e comunitária. **Não é instituição de ensino certificada e não confere graus académicos.**

## Regras de Conduta

- Conteúdo ilegal ou ofensivo é proibido.
- Uso comercial não autorizado é proibido.
- Comprometer a segurança do sistema é proibido.

## Isenção de Responsabilidade

A plataforma é fornecida "tal como está". Não garantimos ausência de erros.

## Contacto

Questões: **facodi@open2.tech**`,
    bodyEn: `# Terms of Use

**Last updated: June 2026**

By using FACODI you agree to these Terms.

## What is FACODI

An open educational platform. **Not an accredited institution and does not award degrees.**

## Conduct Rules

No illegal content, unauthorised commercial use, or compromising platform security.

## Disclaimer

Provided "as is". Contact: **facodi@open2.tech**`,
  },
  cookies: {
    titlePt: 'Política de Cookies',
    titleEn: 'Cookie Policy',
    bodyPt: `# Política de Cookies

**Última atualização: junho de 2026**

| Cookie | Tipo | Finalidade | Duração |
|---|---|---|---|
| sb-auth-token | Essencial | Sessão de autenticação | Sessão |
| facodi_locale | Funcional | Preferência de idioma | 1 ano |
| facodi_saved | Funcional | Unidades curriculares guardadas | 1 ano |

Não utilizamos cookies de rastreamento ou publicidade.

Questões: **facodi@open2.tech**`,
    bodyEn: `# Cookie Policy

**Last updated: June 2026**

| Cookie | Type | Purpose | Duration |
|---|---|---|---|
| sb-auth-token | Essential | Auth session | Session |
| facodi_locale | Functional | Language preference | 1 year |
| facodi_saved | Functional | Saved units | 1 year |

No tracking or advertising cookies. Contact: **facodi@open2.tech**`,
  },
  contacto: {
    titlePt: 'Contacto',
    titleEn: 'Contact',
    bodyPt: `# Contacto

**Email**: facodi@open2.tech
**Web**: [open2.tech/contact](https://open2.tech/contact)

---

## Suporte à Plataforma

Problemas técnicos ou questões de conta → **facodi@open2.tech**

## Curadoria e Contribuições

Candidaturas de curador → [/curator/apply](/curator/apply)

## Proteção de Dados (RGPD)

Pedidos de acesso ou apagamento de dados → **facodi@open2.tech**

---

Operado por [Open2 Technology](https://open2.tech). Resposta em até 5 dias úteis.`,
    bodyEn: `# Contact

**Email**: facodi@open2.tech
**Web**: [open2.tech/contact](https://open2.tech/contact)

---

## Platform Support

Technical issues → **facodi@open2.tech**

## Data Protection (GDPR)

Data requests → **facodi@open2.tech**

---

Operated by [Open2 Technology](https://open2.tech). Response within 5 business days.`,
  },
  acessibilidade: {
    titlePt: 'Declaração de Acessibilidade',
    titleEn: 'Accessibility Statement',
    bodyPt: `# Declaração de Acessibilidade

**Estado:** Beta ativo — melhorias contínuas

## O que Implementámos

- Navegação por teclado em todos os fluxos críticos.
- Atributos ARIA nas principais áreas de layout.
- Contraste de cores validado (WCAG AA).
- Suporte a \`prefers-reduced-motion\`.
- Skip link disponível por teclado.
- Atributo \`lang\` atualizado dinamicamente.

## Conformidade

Objetivo: **WCAG 2.1, nível AA**.

## Reportar um Problema

Barreiras de acessibilidade → **facodi@open2.tech**
Resposta em até 5 dias úteis.`,
    bodyEn: `# Accessibility Statement

**Status:** Active Beta — continuous improvements

## Implemented

- Keyboard navigation for all critical flows.
- ARIA attributes in main layout areas.
- Colour contrast validated (WCAG AA).
- \`prefers-reduced-motion\` support.
- Skip link available via keyboard.

## Compliance

Target: **WCAG 2.1, Level AA**.

## Report

Accessibility barriers → **facodi@open2.tech**`,
  },
  'aviso-legal': {
    titlePt: 'Aviso Legal',
    titleEn: 'Legal Notice',
    bodyPt: `# Aviso Legal

**Operador**: Open2 Technology | **Email**: facodi@open2.tech
**Website**: [facodi.open2.tech](https://facodi.open2.tech)

A FACODI é uma plataforma educacional digital aberta. **Não é uma instituição de ensino reconhecida** e não confere diplomas nem certificados com valor legal.

## Conteúdos de Terceiros

Os conteúdos integrados pertencem aos seus autores. Para pedidos de remoção: **facodi@open2.tech**

## Ligações Externas

Não somos responsáveis pelo conteúdo de sites externos.

## Lei Aplicável

Lei portuguesa. Tribunal competente: comarca de Faro, Portugal.`,
    bodyEn: `# Legal Notice

**Operator**: Open2 Technology | **Email**: facodi@open2.tech
**Website**: [facodi.open2.tech](https://facodi.open2.tech)

FACODI is an open digital educational platform. **Not an accredited institution** and does not award degrees.

## Third-Party Content

Removal requests: **facodi@open2.tech**

## Applicable Law

Portuguese law. Competent court: district of Faro, Portugal.`,
  },
};

const InstitutionalPage: React.FC<Props> = ({ slug, locale = 'pt', t, onBack }) => {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);

    // For 'sobre' slug, use hardcoded institutional content
    if (slug === 'sobre') {
      const title = locale === 'en' ? 'About FACODI' : 'Sobre a FACODI';
      const body = locale === 'en' ? INSTITUTIONAL_CONTENT_EN : INSTITUTIONAL_CONTENT_PT;
      if (!cancelled) {
        setPage({
          slug,
          titlePt: 'Sobre a FACODI',
          titleEn: 'About FACODI',
          bodyPt: INSTITUTIONAL_CONTENT_PT,
          bodyEn: INSTITUTIONAL_CONTENT_EN,
        });
        setLoading(false);
      }
    } else if (LEGAL_CONTENT[slug]) {
      // Use local fallback for legal/compliance pages (Supabase is the canonical source,
      // but we serve local content immediately to guarantee availability and SEO correctness).
      const legal = LEGAL_CONTENT[slug];
      if (!cancelled) {
        setPage({
          slug,
          titlePt: legal.titlePt,
          titleEn: legal.titleEn,
          bodyPt: legal.bodyPt,
          bodyEn: legal.bodyEn,
        });
        setLoading(false);
      }
      // For other slugs, load from Supabase
      loadContentPage(slug).then((result) => {
        if (cancelled) return;
        if (!result) {
          setError('Página não encontrada.');
        } else {
          setPage(result);
        }
        setLoading(false);
      });
    }

    return () => { cancelled = true; };
  }, [slug]);

  const title = page ? (locale === 'en' && page.titleEn ? page.titleEn : page.titlePt) : '';
  const body = page ? (locale === 'en' && page.bodyEn ? page.bodyEn : page.bodyPt) : '';

  return (
    <section className="min-h-screen bg-white">
      {/* Header stripe */}
      <div className="border-b-4 border-black bg-brand-muted py-16">
        <div className="max-w-4xl mx-auto px-8 lg:px-16">
          {onBack && (
            <button
              onClick={onBack}
              className="text-[10px] uppercase font-black tracking-widest mb-6 flex items-center gap-2 hover:underline"
            >
              ← Início
            </button>
          )}
          {loading && (
            <div className="h-10 bg-gray-200 animate-pulse rounded w-64" />
          )}
          {!loading && title && (
            <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">{title}</h1>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-4xl mx-auto px-8 lg:px-16 py-16">
        {loading && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 animate-pulse rounded" style={{ width: `${80 - i * 5}%` }} />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="stark-border p-8 bg-red-50">
            <p className="font-bold text-red-700">{error}</p>
          </div>
        )}
        {!loading && body && (
          <MarkdownView content={body} />
        )}
      </div>
    </section>
  );
};

export default InstitutionalPage;
