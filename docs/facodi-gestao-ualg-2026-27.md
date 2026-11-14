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

Teste de leitura com papel `anon`: curso e 41 UCs visíveis; 41 relações académicas e 84 relações de recursos visíveis; `video_classifications` continua a ser uma tabela privada para a equipa de curadoria. A interface de produção foi validada no navegador remoto: o curso e as páginas de Estadística I e Introdução à Gestão carregam a partir dos dados do Supabase.

## Migrações versionadas

- `20261114181132_facodi_ualg_gestao_1418_official_2026_27_curriculum.sql`
- `20261114181415_facodi_gestao_1418_verified_external_reference_links.sql`
- `20261114181516_facodi_gestao_1418_reuse_49_public_youtube_videos.sql`
- `20261114181637_facodi_gestao_1418_course_taxonomy_and_search.sql`
- `20261114181901_facodi_gestao_1418_canonical_uc_routes.sql`

## Limitações assumidas

1. A posição semestral de Fiscalidade I carece de confirmação devido à duplicação existente no portal oficial.
2. Os temas educativos e guias introdutórios não são fichas oficiais das UCs.
3. Só quatro UCs têm vídeos com correspondência de título/canal suficientemente clara dentro do acervo existente. As restantes continuam navegáveis com descrições e, quando aplicável, leituras externas.
4. Não foram simuladas inscrições, progresso de alunos, classificações produzidas por IA ou playlists submetidas por utilizadores.
5. A pertinência dos 49 vídeos foi avaliada pelos metadados: revisão integral, legendas, direitos e disponibilidade regional continuam por confirmar.
