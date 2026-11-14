# FACODI · Licenciatura em Gestão (UAlg, código 1418) · 2026/27

## Identidade académica

- **Curso:** Licenciatura em Gestão (não confundir com Gestão de Empresas — curso UAlg 1439, nem variantes de Portimão ou noturna).
- **Escola:** Escola Superior de Gestão, Hotelaria e Turismo, Universidade do Algarve.
- **Campus:** Penha, Faro; ensino politécnico, diurno, presencial, em português.
- **Curso UAlg:** `1418`; **FACODI:** `LGEST`, slug `gestao`; **duração:** três anos/seis semestres; percurso **180 ECTS**.
- **Acreditação:** A3ES, registo R/A-Ef 2279/2011; válido até 31 de julho de 2031, segundo a página oficial.
- **Plano curricular de referência:** 2026/27.
- **Páginas institucionais:**
  - https://www.ualg.pt/curso/1418
  - https://www.ualg.pt/curso/1418/plano
  - https://www.ualg.pt/curso/1418/avaliacao

## Regras de importação e validação

O plano oficial de 2026/27 contém **41 códigos distintos de UC**: 28 UCs obrigatórias e 13 alternativas pertencentes a três grupos de opções: I (CE), II (QAC), III (QAC). Para a contagem de créditos de um percurso pessoal:

| Ano | Obrigatórias | Escolhas | ECTS necessários |
|---|---:|---|---:|
| 1.º | 60 | Nenhuma | 60 |
| 2.º | 60 | Nenhuma | 60 |
| 3.º | 45 | Uma alternativa de cada grupo I, II e III (5+5+5) | 60 |
| **Total** | **165** | **15** | **180** |

A soma de TODAS as UCs disponíveis é 230 ECTS, **não** representa o percurso de um estudante. Em particular, **Fiscalidade I (código 14181193)** está repetida na página institucional, no 1.º e 2.º semestres do segundo ano. Foi criada **uma única UC**, colocada provisoriamente no 1.º semestre, e o erro de dupla listagem foi guardado em `metadata.listed_semesters=[1,2]` e `official_semester_checked=false`. Esta distribuição permanece sujeita a confirmação institucional, sem duplicação de créditos.

O ensino oficial, títulos, códigos, ECTS e grupos de opção foram transcritos da fonte. As **41 descrições e temas de estudo são textos originais de apoio FACODI**, derivados dos títulos/assuntos gerais. Não foram importadas nem alegadas fichas completas da UC, bibliografia ou resultados de aprendizagem oficiais.

## Materiais e grafo

### Atualização de 14/11/2026 (21h UTC)

- **41 atividades práticas originais**, uma por UC, publicadas com cenário hipotético e entrega sugerida (não são avaliações UAlg).
- **123 objetivos de estudo editoriais** de apoio, derivados dos três temas previamente identificados por UC, indexados no catálogo e acessíveis na página da UC; não são resultados de aprendizagem oficiais.
- **196 relações a referências externas** entre UCs e fontes institucionais, livros, bases de dados e páginas educativas. Todas as 41 UCs têm pelo menos uma referência. A informação foi vinculada por URL e não duplicada por curso.
- **56 vídeos distintos associados ao curso**: 49 registos históricos reutilizados de `public.videos` e sete vídeos adicionais incorporados apenas no schema `facodi` como URLs YouTube (não houve escrita em `public`). São **58 ligações UC→vídeo** porque dois vídeos complementam mais do que uma UC.
- **11 UCs com pelo menos um vídeo**, 30 sem aulas selecionadas com pertinência suficiente; estas têm atividades e bibliografia.
- **Três sequências editoriais FACODI**: Estatística I (25), Estatística II (21), Matemática Financeira (3); 49 relações playlist→vídeo. As listas são objetos editoriais da FACODI, **não playlists criadas em contas do YouTube**.
- **Quatro portais de aulas institucionais** acrescentados por links externos (FCCN Educast, e-Aulas USP e literacia financeira IPV); não se alojam vídeos na FACODI.

Os recursos recém-adicionados abrangem documentos do Diário da República, OCC, Pordata, Eurostat, BCE, IAPMEI e manuais OpenStax. Os vídeos novos abrangem contabilidade financeira, matemática financeira, economia, marketing e investimento. As decisões de associação por título/canal **não equivalem a revisão integral das aulas, nem a endosso da UAlg**.

O acervo é composto de **links para fontes originais**, sem reprodução de textos de livros. OpenStax e outros titulares reservam direitos e podem restringir a reutilização comercial ou o processamento por IA. A FACODI **não efetuou ingestão** do texto integral externo.

### Lote inicial (preservado)

- **41 objetos** de UC, **um objeto** de curso, **41 relações curso→UC**.
- **49 vídeos externos** já existentes em `public.videos`, associados a quatro UCs: Estatística I (25), Estatística II (21), Informática para Gestão (2), Matemática I (1).
- Os vídeos foram reutilizados por UUID, sem criar novos registos em `public.videos` nem duplicar ficheiros multimédia.
- Os vídeos têm marca `review_scope=title_and_channel_only` e `source_video_fully_reviewed=false`: o conteúdo completo não foi inspecionado; os links são apenas materiais complementares, nunca aulas oficiais da UAlg.
- **11 fontes externas de leitura**, com **35 ligações** às UCs. Para duas fontes OpenStax já presentes no catálogo geral, a FACODI reutiliza o mesmo objeto pelo URL.
- Fontes verificadas incluem CNC/SNC (https://www.cnc.min-financas.pt/snc2016.html), INE (https://ine.pt/xportal/xmain?xpgid=ine_base_dados&xpid=INE), Banco de Portugal (https://clientebancario.bportugal.pt/pt-pt/creditos-consumidores), Autoridade Tributária (https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/Pages/default-com-pdf.aspx), Diário da República (https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475) e livros OpenStax.
- **Não foi copiado texto integral de livros, normas, páginas externas ou vídeos.** As referências são apenas links; isto não pressupõe licença de reprodução, permissão de treino por IA, nem endosso das instituições.

## API, RLS e rotas públicas

Tabelas utilizadas: `facodi.courses`, `facodi.curricular_units`, `facodi.learning_objects`, `facodi.learning_object_relations`, `facodi.external_sources`, `facodi.unit_videos`, `facodi.video_classifications`, `facodi.tags`, `facodi.learning_object_tags`, `facodi.keywords`. Origem dos vídeos: apenas leitura de `public.videos`, com o catálogo partilhado preservado.

- Curso: https://facodi.vercel.app/courses/gestao
- Unidade: https://facodi.vercel.app/courses/gestao/units/14181187
- Unidade: https://facodi.vercel.app/courses/gestao/units/14181179

Todas as 41 UCs passaram a usar o **código UAlg como slug**, em consistência com LESTI e CTeSP.

Teste de leitura com papel `anon` após enriquecimento: **1 curso, 41 UCs, 123 objetivos editoriais e 257 relações públicas diretamente a partir das páginas de UCs** (196 referências, 58 associações a vídeo e 3 associações a playlists). Os registos de `video_classifications` continuam privados (0 expostos). O grafo contém adicionalmente as 41 relações curso→UC e as 49 relações playlist→vídeo, todas com proveniência. A interface já consome diretamente os dados do Supabase.

## Migrações versionadas

- `20261114181132_facodi_ualg_gestao_1418_official_2026_27_curriculum.sql`
- `20261114181415_facodi_gestao_1418_verified_external_reference_links.sql`
- `20261114181516_facodi_gestao_1418_reuse_49_public_youtube_videos.sql`
- `20261114181637_facodi_gestao_1418_course_taxonomy_and_search.sql`
- `20261114181901_facodi_gestao_1418_canonical_uc_routes.sql`
- `20261114210029_facodi_gestao_41_educational_study_goals_and_topic_search.sql`
- `20261114210443_facodi_gestao_extended_official_and_open_reference_library.sql`
- `20261114210508_facodi_gestao_reuse_cross_course_reference_library.sql`
- `20261114210719_facodi_gestao_verified_seven_external_youtube_lessons.sql`
- `20261114210910_facodi_gestao_41_original_practice_activities.sql`
- `20261114211050_facodi_gestao_three_editorial_video_learning_paths.sql`
- `20261114211126_facodi_gestao_portuguese_institutional_video_lectures.sql`

## Enriquecimento curricular complementar (14/11/2026, 21h–22h)

### Competências e atividades

- Foram registadas **123 competências propostas pela FACODI** (três por UC), ligadas uma a uma aos **123 objetivos de estudo** existentes.
- Cada competência tem identificador `FACODI-GESTAO-<codigo-UC>-<ordem>`, título, nível introdutório, fonte de metadados e `official_curriculum_outcome=false`; não é um resultado acreditado oficialmente.
- As **41 atividades práticas** passaram a ter quatro orientações adicionais específicas: preparação, execução, verificação do resultado e erro frequente. Estas orientações são originais da FACODI e constam no HTML público das UCs.
- Os conteúdos anteriores de títulos, descrições, vídeos, leituras e exercícios foram preservados; não foram criados progressos de estudantes nem submissões de avaliação fictícias.

### Arquivo do ano letivo 2025/26

- Criada `facodi.course_curriculum_archives`, com RLS ativada, política pública apenas para arquivo publicado de curso ativo e política de escrita restrita a editores FACODI.
- Importado e publicado o **plano oficial 2025/26** com **46 UCs/ofertas distintas**, incluindo uma UC anual e duas famílias de alternativas. O percurso académico de referência continua a somar **180 ECTS**, escolhendo as opções, não todas as alternativas.
- **Comparação estritamente por código:** 10 códigos comuns, 36 encontrados apenas em 2025/26 e 31 encontrados apenas em 2026/27. Não implica equivalência, substituição ou creditação académica.
- A componente de consulta do histórico foi **implementada na branch `facodi`** (anos, semestres, opções, créditos e comparação por código). **O novo frontend ainda não foi confirmado em produção**: a Vercel devolveu erro `402 api-deployments-free-per-day`, quota diária de mais de 100 deployments. O arquivo já está publicado na API Supabase e a descrição textual no site é atualizada pela base de dados.
- O plano corrente 2026/27 mantém as suas **41 UCs**, sem incorporação dos códigos antigos como unidades ativas.

### Acesso ao curso 2026/27

A página oficial do Concurso Nacional de Acesso da UAlg [publica para o ano letivo 2026/27](https://www.ualg.pt/curso/1418/candidaturas?tipo=concurso-nacional) **76 vagas**, propina anual **697 €**, mínimos de **100 pontos na candidatura** e **95 pontos nas provas de ingresso**, com ponderação 50% secundário e 50% provas. Estes dados foram guardados em `courses.metadata.admissions_2026_27` com a fonte, ano e aviso de possível alteração nos concursos seguintes. **Não se assume que se aplicam a 2027/28.**

### Segurança e fontes

A nova tabela não expõe escrita ao público, e os objetivos/competências continuam marcados como material editorial. Com o papel `anon`, foram verificados **123 registos de competências**, **123 objetivos ligados** e **um arquivo histórico** visível. Os 46 registos históricos estão encapsulados num snapshot, sem misturar créditos e UCs dos diferentes anos.

---

## Limitações assumidas

1. A posição semestral de Fiscalidade I carece de confirmação devido à duplicação existente no portal oficial.
2. Os temas educativos e guias introdutórios não são fichas oficiais das UCs.
3. Há 11 UCs com pelo menos um vídeo selecionado pelo título/canal. As 30 restantes continuam navegáveis com atividade prática, objetivos e leituras externas.
4. Não foram simuladas inscrições, progresso de alunos, classificações produzidas por IA ou playlists submetidas por utilizadores.
5. A pertinência dos 56 vídeos distintos foi inferida de metadados de origem: revisão integral, legendas, direitos de incorporação e disponibilidade regional continuam por confirmar.

## Estado de implantação em 14/11/2026

- **Supabase — concluído:** todas as migrações deste lote aplicadas e verificadas. As 41 UCs, 123 competências, 123 objetivos associados e o arquivo 2025/26 passam nos testes RLS anónimos.
- **GitHub — concluído:** migrations, tipos Supabase, componente React e traduções PT/EN/ES/FR commitados na branch `facodi`.
- **Vercel — limitador externo:** o pedido de build preview para o commit deste lote foi recusado com `402 payment_required` (`api-deployments-free-per-day`, mais de 100 deployments no dia, `retryAfter=86400`). O último deploy de produção verificado correspondia a commit anterior `f815be51358a5b82680b9d14b18f48eaa7d8545c`.
- **Não atribuir ao frontend já publicado** a nova tabela histórica até se confirmar um deployment posterior com commit atualizado; a apresentação do curso e o conteúdo HTML das UCs servidos via Supabase são visíveis independentemente do build.
- **Atenção:** não forçar outro deployment nem alterar plano/faturação sem pedido do utilizador. Fazer deploy após restabelecimento da quota e verificar a página do curso, o carregamento de `course_curriculum_archives` e a tabela histórica.
