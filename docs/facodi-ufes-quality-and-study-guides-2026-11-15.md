# FACODI · Letras Inglês UFES — qualidade curricular, guias e cobertura real

**Data:** 15/11/2026  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid`  
**Schema:** `facodi`  
**Branch:** `Open2Tech/facodi:facodi`  
**Curso público:** https://facodi.vercel.app/courses/ufes-letras-ingles  
**Currículo-base:** [PPC 2019 da UFES](https://letras.ufes.br/pt-br/ppc-2019-versao-atual)  
**Contexto do lote anterior:** [87 vídeos e arquivo do PPC 2006](facodi-ufes-english-videos-history-2026-11-15.md)

## Resumo

Foram executadas as melhorias naturalmente prioritárias depois de publicar 87 vídeos, 36 referências e o arquivo de 2006:

1. **Carga horária correta**: as páginas do curso e das UCs mostram as horas brasileiras de `metadata.official_course_hours` / `metadata.official_hours` e, nas fichas das UCs, os créditos brasileiros, **sem converter para ECTS**. O arquivo do PPC de 2006 mantém o mesmo princípio.
2. **Optativas organizadas**: os quatro grupos de escolha do PPC 2019 passaram a ter cabeçalhos distintos (24/11/5/5 ofertas; escolher 5/3/1/1), com mensagem explicativa de que não se cursam todas as 45 alternativas.
3. **Cobertura curricular dinâmica**: a nova view `facodi.course_unit_content_coverage` calcula, diretamente a partir das relações publicadas e aprovadas, o número de vídeos e leituras por UC. A listagem deixa de exibir o ícone de vídeo em todas as UCs indiscriminadamente; o ícone agora indica apenas a existência de um recurso publicado e apresenta o número real de vídeos quando disponível.
4. **15 guias de estudo próprios**: as 15 UCs sem vídeos diretamente curados receberam, no campo `curricular_units.description_html`, roteiros autorais FACODI, com foco pedagógico específico, três etapas, uma atividade prática e duas perguntas para autoavaliação.

## Os 15 guias originais

| Código | Tema |
| --- | --- |
| LCE13698 | Fundamentos da Libras e acessibilidade |
| LET10553 | Português como língua estrangeira |
| LET13924 | Introdução aos estudos da tradução |
| LET13929 | Práxis: tradução e ensino |
| LET13938 | Tópicos em tradução |
| LET13940 | Filosofia da linguagem |
| LET13941 | Linguística aplicada crítica |
| LET13958 | Inglês para fins específicos |
| LET13961 | Literatura medieval em inglês |
| LET13969 | Literatura e outras artes |
| LET13971 | Literaturas de língua portuguesa |
| LET13972 | Literatura infantil e juvenil |
| LET13973 | Cânones da crítica internacional |
| LET13974 | Literatura do Espírito Santo |
| TEP13690 | Relações étnico-raciais e educação antirracista |

Todos os guias são complementares: **não são ementas, bibliografias oficiais, planos docentes ou avaliações aprovadas pela UFES**. Não foram criados alunos, matrículas, presenças, certificados ou vídeos sem fonte verificada. A importação preservou descrições preexistentes: a migração aborta se qualquer das 15 UCs já tiver conteúdo HTML editorial, evitando sobrescrita de terceiros. São propostas de autoestudo, não horas letivas adicionais.

## View de acompanhamento, segurança e validações

`facodi.course_unit_content_coverage` é uma view PostgreSQL **`security_invoker=true`**. O cálculo usa apenas `courses` e `curricular_units` publicados/ativos, relações `contains` com `metadata.review_status='approved'` e objetos filhos publicados/ativos. Conta vídeos e leituras sem duplicar registos na mesma UC. As permissões são `GRANT SELECT TO anon,authenticated`, sem permissões de escrita. Todas as tabelas subjacentes conservam RLS.

Teste transacional com `SET LOCAL ROLE anon`:

| Métrica no curso UFES | Resultado |
| --- | ---: |
| UCs visíveis | 75 |
| UCs com vídeos | 60 |
| UCs com leituras | 75 |
| Associações vídeo–UC | 291 |
| Guias originais visíveis | 15 |
| Leitura anónima de `generated_structures` | **Negada** |

A view foi testada antes da aplicação e a migração dos guias passou uma simulação `BEGIN … ROLLBACK`, com verificação de códigos distintos, conteúdos preexistentes, número de etapas e publicação. As guias foram publicadas como `description_html` com aviso de proveniência e metadados `facodi_original_study_guide=true`, `faculty_approval=false` e `editorial_review=original_facodi_proposal`.

## Código

- `src/entities/course/brazilianCurriculum.ts`: leitores seguros para horas e créditos brasileiros, e ordem dos quatro grupos optativos (sem alterar a fonte original).
- `src/entities/course/brazilianCurriculum.test.ts`: testes para casos normais, valores em falta e metadados inconsistentes.
- `src/pages/CourseDetails.tsx`: horas, grupos optativos, cobertura pública e quantidades reais de vídeo.
- `src/pages/UnitDetails.tsx`: horas brasileiras, créditos locais e grupo optativo; não trata 45 optativas sem semestre fixo como colegas do mesmo período.
- `src/features/courses/queries/useCourseCoverage.ts`: consulta pública, com cache, à view RLS.
- `src/integrations/supabase/types.ts`: tipagem da view.
- `src/i18n/locales/{pt,en,es,fr}.json`: localização de grupos, horas, créditos e cobertura.

Migrações aplicadas e versionadas:
- `20261115064247_facodi_public_rls_safe_curriculum_content_coverage_view.sql`
- `20261115064742_facodi_ufes_15_original_editorial_study_guides_without_unverified_videos.sql`

## Continuidade recomendada

- Obter revisão de docente de Letras/Inglês para os guias editoriais, especialmente Libras, tradução e ensino antirracista; não transformar a revisão automática em aprovação institucional.
- Rever periodicamente a disponibilidade e a adequação dos links externos, mantendo o vídeo no canal de origem.
- Melhorar a representação do plano em percursos por escolha individual **sem criar matrículas reais** nem presumir equivalências/ECTS.
- Tratar os avisos do Supabase Security Advisor sobre funções privilegiadas existentes numa auditoria separada, pois alterações indiscriminadas a `public` podem afetar o Tube.
