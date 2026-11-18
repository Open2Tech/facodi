# CTeSP em Marketing Digital, UAlg/ESGHT 1929 (Faro)

**Data:** 2026-11-18
**Manifesto:** `supabase/seeds/facodi_ualg_1929_ctesp_marketing_digital_20261118.json`
**Script SQL:** [`facodi_ualg_1929_ctesp_marketing_digital_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1929_ctesp_marketing_digital_20261118/supabase/seeds/facodi_ualg_1929_ctesp_marketing_digital_20261118.sql). Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).

## Identidade

- **Curso:** Curso Técnico Superior Profissional (CTeSP) em Marketing Digital, Escola Superior de Gestão, Hotelaria e
  Turismo da Universidade do Algarve, curso **1929**.
- **Local:** Faro, Campus da Penha. Presencial, em português.
- **Duração:** 120 ECTS, 4 semestres, com estágio de 30 ECTS no último.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1929) e [plano 2026/27](https://www.ualg.pt/curso/1929/plano).
- **Na FACODI:** código interno `CTESP-MD`, slug `ctesp-marketing-digital`, tipo de grau `CTeSP`, como o `CTESP-STI`.

**Faro e Portimão.** A pesquisa de playlists indicava "Faro e Portimão". São duas ofertas distintas: a lista de CTeSP
da UAlg para 2026/27 tem "Marketing Digital" (32 vagas) e "Marketing Digital - Portimão" (25 vagas). Este lote é o
curso de **Faro (1929)**. **Portimão tem um plano à parte**, que não entra aqui. A lista pública só liga ao curso 1929,
por isso o ID de Portimão fica por identificar. Fica registado em `metadata.separate_offerings`, como no `CTESP-STI`
com o curso 1970.

## Plano 2026/27

**19 UCs, todas obrigatórias, 120 ECTS:** 18 UCs de 5 ECTS nos três primeiros semestres (6 por semestre) e o
Estágio de 30 ECTS no 4.º semestre. Cada semestre soma 30 ECTS. Não há grupos de opção nem ramos.

- **Semestres.** Seguem o `CTESP-STI` na base:
  - `year` é o ano (1 ou 2);
  - `semester` é o semestre do curso (1 a 4);
  - `metadata.local_semester` é o semestre dentro do ano (1 ou 2), como aparece no plano.
- **`curriculum_placements`** em todas as UCs: `mandatory`, `Tronco Comum`, com o mesmo ano e semestre da UC.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt). As 19 fichas
  estão publicadas, incluindo a do Estágio, e o URL de cada uma fica em `metadata.official_fuc_url`.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 19291004 | Escrita para a Web e Storytelling | 5 | 2 | Curso de Redação na WEB — IFMA, Campus São Luís Monte Castelo |
| 1.º | 1.º | 19291000 | Gestão e Empreendedorismo | 5 | 2 | Empreendedorismo e Inovação — UNIVESP |
| 1.º | 1.º | 19291002 | Informática | 5 | 1 | [PPT] Série Como Criar Apresentações do Zero — Hashtag Treinamentos |
| 1.º | 1.º | 19291016 | Inglês Técnico | 5 | 2 | Inglês para Marketing Digital — KULTIVI seu INGLÊS |
| 1.º | 1.º | 19291001 | Introdução ao Marketing | 5 | 2 | Marketing — Prof. Thiago Meneghel |
| 1.º | 1.º | 19291003 | Introdução às Tecnologias Web | 5 | 2 | Curso completo e atual de HTML5 e CSS3 - Módulo 1 de 5 — Curso em Vídeo |
| 1.º | 2.º | 19291006 | Comportamento do Consumidor Online | 5 | 2 | Comportamento do Consumidor — Marina Monteiro Garcia |
| 1.º | 2.º | 19291007 | Design de Comunicação | 5 | 2 | Os Fundamentos do Design — Chief of Design |
| 1.º | 2.º | 19291005 | Marketing de Conteúdos | 5 | 2 | Fundamentos de Marketing de Conteúdo — Kultivi |
| 1.º | 2.º | 19291010 | Search Engine Advertising | 5 | 2 | Curso gratuito de Google Ads para iniciantes — Adriano Gianini |
| 1.º | 2.º | 19291008 | Search Engine Optimization | 5 | 2 | Curso prático de SEO - Módulo 2 - Conteúdo — Curso em Vídeo |
| 1.º | 2.º | 19291009 | Tecnologias Multimédia | 5 | 2 | Curso completo de edição de vídeo (2025) — Felipe Drumond |
| 2.º | 3.º | 19291018 | Comércio Eletrónico | 5 | 2 | Organizações digitais e modelos de negócios — UNIVESP |
| 2.º | 3.º | 19291013 | Email e Mobile Marketing | 5 | 1 | Email Marketing Gratuito Curso 2026 na Prática — Email Marketing na Prática |
| 2.º | 3.º | 19291011 | Gestão e Publicidade em Redes Sociais | 5 | 2 | Facebook / Meta Ads - Curso Gratuito — Invente, Frederico Isfer Bittencourt |
| 2.º | 3.º | 19291014 | Métodos Quantitativos | 5 | 2 | Estatística aplicada aos negócios — UNIVESP |
| 2.º | 3.º | 19291012 | Métricas e Web Analytics | 5 | 2 | Google Analytics 4 — Mundo do Traqueamento |
| 2.º | 3.º | 19291015 | Plano de Marketing Digital | 5 | 2 | Plano de Marketing na Prática — Líderes em Ação |
| 2.º | 4.º | 19291017 | Estágio | 30 | 0 | — |

A coluna "Playlists" conta só as ligações publicadas (confiança alta ou média).

## Playlists

- **Volume:** 34 playlists publicadas em 34 ligações, para as **18 UCs letivas**. O Estágio não tem playlist.
- **Idioma:** 32 em PT-BR e 2 em inglês (o canal oficial da Semrush, que a própria ficha de SEO usa, e o Business
  English da engVid).
- **Confiança:** 15 alta e 19 média publicadas; 1 baixa, que fica fora do SQL.
- **Nível:** sobretudo cursos técnico-profissionais de educadores e canais oficiais (Curso em Vídeo, Kultivi, Semrush),
  com 7 playlists universitárias (UNIVESP e professores identificados).
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos).
- **Reutilização:** uma playlist já registada com o mesmo ID do YouTube é reaproveitada, e não duplicada. Hoje são 3,
  vindas do #69: HTML5 e CSS3 (Curso em Vídeo), SEO Módulo 2 (Curso em Vídeo) e edição de vídeo (Felipe Drumond).
- **Ordem:** a melhor playlist publicada de cada UC fica em `position` 91001 e a segunda em 91002.

## Para rever

- **Confiança baixa, fora do SQL** (no manifesto com `"published": false`):
  - Informática, com *WORD BÁSICO* (Sou independente digital). A ficha pede Word avançado, segurança informática e
    computação na nuvem, e só se encontrou Word básico.
- **Só uma playlist:**
  - Informática, só com PowerPoint. Segurança informática e computação na nuvem ficam sem playlist;
  - Email e Mobile Marketing, com uma só ferramenta (Brevo). A legislação das bases de dados (RGPD) e o mobile
    marketing ficam sem playlist.
- **Sem playlist:** o Estágio.
- **Matérias portuguesas sem cobertura:** a legislação do comércio eletrónico (DL 7/2004 e diretivas da UE), o
  enquadramento legal dos conteúdos multimédia e a gramática do português europeu na Escrita para a Web. As playlists
  cobrem o resto do programa dessas UCs.
- **Interface antiga:** a 2.ª playlist de Search Engine Advertising (Curso em Vídeo) foi gravada há 4 a 5 anos, antes
  das mudanças na interface do Google Ads.

## Verificação

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução, com as 3 playlists do #69 já registadas | 1 curso (120 ECTS, 4 semestres), 19 UCs, 31 playlists novas e 3 reaproveitadas, 19 relações curso → UC e 34 relações UC → playlist |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `CTESP-MD` | Aborta antes de inserir |
| Código de UC já usado como slug noutro curso | A UC deste curso fica com o slug `ctesp-marketing-digital-uc-<código>` |

Hoje nenhum código de UC deste curso existe na base. O último caso foi testado só para confirmar a regra.

**Pré-verificações:**
- 19 UCs, 120 ECTS e 30 ECTS em cada um dos 4 semestres;
- uma colocação por UC;
- só ligações de confiança alta ou média;
- IDs, URLs e nº de vídeos das playlists;
- conflitos de curso (código, slug ou ID 1929).

**Pós-verificação:** confirma o curso publicado, as 19 UCs com colocação e as 34 ligações. Se alguma linha não
entrar, a transação inteira é revertida.

**Vista do plano:** simulada com o `buildUalgSections` do #67 e os dados do manifesto. Cada semestre mostra as
obrigatórias com 30 ECTS: Ano 1 · Semestre 1 e 2, Ano 2 · Semestre 3 e 4 (o Estágio). Não há grupos de opção.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72):
[`supabase/seeds/facodi_ualg_1929_ctesp_marketing_digital_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1929_ctesp_marketing_digital_20261118/supabase/seeds/facodi_ualg_1929_ctesp_marketing_digital_20261118.sql),
na branch `scripts/facodi_ualg_1929_ctesp_marketing_digital_20261118` do fork. Não é uma migração.

O script corre numa única transação e não foi aplicado em produção. Depois de aplicado, o build seguinte gera as
páginas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
