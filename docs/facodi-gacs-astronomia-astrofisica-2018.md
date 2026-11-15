# FACODI — Astronomia e Astrofísica, percurso independente inspirado no GACS/Ifes Cariacica (2018)

**Publicação editorial:** 15 de novembro de 2026  
**Frontend de desenvolvimento:** https://facodi.marcelo-0d6.workers.dev/courses/astronomia-astrofisica-gacs-2018  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid` · schema `facodi`  
**Código do percurso:** `FACODI-GACS-ASTRO-2018`  
**Repositório:** `Open2Tech/facodi` · branch `facodi`

## Justificativa e limites históricos

Uma pessoa que estudou no curso técnico integrado em Administração no Ifes Campus Cariacica e participou do Grupo Astronômico Carl Sagan (GACS) relatou ter frequentado uma introdução à Astrofísica em 2018. Essa memória motivou a disponibilização de um **novo roteiro de estudo aberto, organizado pela FACODI em 2026**.

A fonte institucional do Ifes identifica o GACS como **programa de extensão**, ativo como tal desde 2017, com ações de divulgação científica, observações, oficinas, apresentações e envolvimento dos alunos do ensino médio e superior. O testemunho de participação é informação do interessado, **não prova oficial de matrícula ou certificado**.

**Atenção às três atividades distintas:**

1. **GACS/Ifes Campus Cariacica:** contexto histórico do interesse e da experiência relatada. As datas e o programa detalhado de um suposto curso introdutório específico do GACS em 2018 **não foram verificados por edital, plano de aulas ou certificado**.
2. **Licenciatura em Física do Ifes Cariacica (grade de 2018):** a disciplina *Introdução à Astronomia e Astrofísica* integra o 6.º período, com **60 horas, 4 créditos** e pré-requisito Física IV. Esses dados **não** se aplicam ao percurso da FACODI nem comprovam ter sido ministrada uma edição do curso de extensão com idêntica carga horária.
3. **Curso de Introdução à Astronomia e Astrofísica do INPE (2018):** realizado em **São José dos Campos**, de **2 a 6 de julho de 2018**, por outra instituição. Disponibiliza apostila, apresentações e oficinas relevantes para estudo, **não** uma prova de qual era o conteúdo do GACS no Ifes.

O catálogo, a descrição, cada unidade e os seus metadados identificam `facodi_independent_reconstruction=true`, `official_ifes_course=false` e `ects_not_applicable=true`. Não são inventadas horas, notas, matrícula, certificação ou créditos. Não foram incluídos nomes nem fotografias do participante, sem autorização para atribuição pública.

## Estrutura publicada: 10 etapas de estudo

| Código interno | Etapa |
|---|---|
| ASTRO01 | Astronomia, investigação científica e GACS |
| ASTRO02 | Esfera celeste e orientação astronómica |
| ASTRO03 | Sistema Sol–Terra–Lua |
| ASTRO04 | Sistema Solar e exploração espacial |
| ASTRO05 | Luz, espectro e telescópios |
| ASTRO06 | O Sol e a evolução das estrelas |
| ASTRO07 | Via Láctea e outras galáxias |
| ASTRO08 | Cosmologia e expansão do Universo |
| ASTRO09 | Ondas gravitacionais e astrobiologia |
| ASTRO10 | Oficinas e divulgação científica do GACS |

Cada etapa contém foco, três tópicos, atividade prática original e duas perguntas de autoavaliação. Foram ainda elaborados **20 objetivos de estudo editoriais** (dois por unidade). O enquadramento é introdutório: não são conteúdos transcritos de um programa institucional desaparecido.

## Fontes institucionais e bibliografia externa

- [Ifes — GACS na página de Extensão do Campus Cariacica](https://cariacica.ifes.edu.br/extensao-pesquisa-e-pos-graduacao/extensao?showall=1)
- [INPE — apostila *Introdução à Astronomia e Astrofísica* (2018)](https://www.inpe.br/ciaa2018/arquivos/pdfs/apostila_completa_2018.pdf)
- [INPE — índice oficial do material de 2018](https://antigo.inpe.br/ciaa2018/material-curso.php)
- [INPE — apresentação da edição de 2018, em São José dos Campos](https://www.inpe.br/ciaa2018/)
- [Ifes — grade 2018 da Licenciatura em Física](https://cariacica.ifes.edu.br/images/stories/Artigos/2020/Grade_Curricular_Licenciatura_NOVA_2020.pdf)
- [Ifes — ementário da Licenciatura em Física](https://cariacica.ifes.edu.br/images/stories/Artigos/2020/Ap%C3%AAndice_I_-_Ement%C3%A1rio_Licenciatura_F%C3%ADsica.pdf)

**Bibliografia clássica citada no ementário do Ifes**, para pesquisa ou consulta por vias legais:
- Kepler de Souza Oliveira Filho e Maria de Fátima Saraiva, *Astronomia e Astrofísica*.
- Sérgio Mascarello Bisch, *Introdução à Astronomia*.

O texto das apostilas não foi copiado integralmente nem foram distribuídos ficheiros externos: estão guardadas apenas as referências e URLs originais, preservando direitos e atribuições.

## Vídeos e vínculos académicos

Foram reutilizados **9 vídeos já presentes** em `facodi.youtube_videos`, totalizando **14 associações** às etapas. As origens são principalmente UNIVESP e Ciência Sem Fim. Os vídeos são recursos de apoio, **não gravações do GACS em 2018 ou aulas do curso do INPE**.

Registos e ligações novos:
- 1 linha em `facodi.courses`, associada ao seu `learning_objects` próprio;
- 10 linhas em `facodi.curricular_units` com 10 objetos `curricular_unit`;
- 6 recursos institucionais e 6 fichas `facodi.external_sources`;
- 22 relações unidades→fontes externas;
- 14 relações unidades→vídeos, com `review_scope=title_and_channel_only`;
- 10 relações curso→unidades e 20 objetivos de aprendizagem editoriais;
- 1 relação `correlates_with` com o curso técnico integrado em Administração de 2026, explicitamente sem afirmar que a atividade integra o currículo vigente.

A carga horária formal é **nula**, o ECTS não se aplica e o ano/semestre das etapas são nulos para não criar uma periodização institucional fictícia.

## Migrações e segurança

1. `20261115145040_facodi_gacs_2018_independent_astronomy_study_path_10_units.sql`
2. `20261115145329_facodi_gacs_2018_20_original_editorial_learning_outcomes.sql`
3. `20261115145711_facodi_gacs_outcomes_existing_public_rls_compatibility.sql`

Todos os comandos foram simulados com `BEGIN … ROLLBACK`, depois aplicados no Supabase. A terceira migração classifica os 20 objetivos de aprendizagem no **padrão editorial já permitido** pela RLS da FACODI (`source=facodi.curricular_units.metadata.study_topics` e `official_learning_outcome=false`), sem alargar políticas.

A consulta de verificação com `SET LOCAL ROLE anon` confirmou: 1 curso, 10 unidades, 6 fontes, 14 associações a vídeos e 10 linhas de cobertura curricular visíveis; o papel anónimo continua sem permissão de leitura sobre `generated_structures`.

## UX React/Cloudflare

Na branch `facodi`, `CourseDetails` usa **Percurso de estudo independente** e **Etapas temáticas propostas pela FACODI** em vez de apresentar anos/semestres inexistentes. Em `UnitDetails`, o selo do recurso passa a **Etapa de estudo FACODI**. Os textos foram internacionalizados em PT/EN/ES/FR.

O site de desenvolvimento é `https://facodi.marcelo-0d6.workers.dev`, não a Vercel. O vínculo ao Supabase é dinâmico: a publicação do curso e dos objetivos está visível na API antes mesmo do deploy dos novos rótulos. O CI TypeScript/lint/test/build deve ser acompanhado no GitHub Actions e o estado específico do deploy Cloudflare só pode ser confirmado diretamente no seu ambiente.

## Continuidade editorial

A reconstrução melhora com documentos reais da atividade de 2018: certificado, plano de aulas, lista de temas, cartazes, registos das oficinas, datas ou material docente, caso o participante os disponibilize futuramente. Até lá, não se atribui ao GACS uma estrutura de 10 unidades oficial, nem se apresenta a experiência como diploma ou crédito de graduação. Nenhuma comunicação ou e-mail foi enviado ao Ifes.
