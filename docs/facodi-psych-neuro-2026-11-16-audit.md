# FACODI — auditoria de Psicologia e Neurociências (2026-11-16)

## Escopo e fontes

- Repositório: [Open2Tech/facodi](https://github.com/Open2Tech/facodi), branch `facodi`.
- Supabase: projeto `wvkjainfwsyiyfcmbtid`, esquema **`facodi`**. Nenhum dado curricular foi extraído do esquema `public`.
- Planos oficiais UAlg para **2026/27**:
  - [Licenciatura em Psicologia — curso 1452](https://www.ualg.pt/curso/1452/plano)
  - [Mestrado em Neurociências Cognitivas e Neuropsicologia — curso 1526](https://fchs.ualg.pt/curso/1526/plano)
- Testes: funções SQL públicas sob `SET LOCAL ROLE anon`; CI GitHub e verificação read-only do build do Cloudflare Workers.

## Inventário verificado

| Item | Resultado |
|---|---:|
| Psicologia: UCs únicas publicadas e com guia de estudo | 40 |
| Mestrado: UCs únicas publicadas e com guia de estudo | 22 |
| Sequências publicadas associadas a estes cursos | 15 (8 + 7) |
| Vídeos nas sequências: posições ordenadas | 60 |
| Relações UC → sequência com `review_scope=title_and_channel_only` | 64 |
| Sequências sem qualquer vídeo | 0 |
| IDs YouTube duplicados em `facodi.youtube_videos` | 0 |
| Resultados públicos em `search_public_resources_v4(p_area=>'psychology')` | 110 |

Estes são **inventários técnicos**, não uma alegação de avaliação científica integral dos vídeos, homologação docente ou equivalência curricular UAlg. Um vídeo pode aparecer em mais de uma sequência sem ser duplicado na base de dados. Os 110 resultados são objetos de diferentes tipos, não vídeos distintos.

## Divergências corrigidas

1. **Via de conclusão do mestrado** — a ficha de 2026/27 apresenta:
   - *Neurociências Cognitivas*: dissertação, **60 ECTS**, código `15261012`.
   - *Neuropsicologia*: estágio **30 ECTS** (`15261018`) e dissertação **30 ECTS** (`15261019`).
   - A antiga associação de `15261012` com a especialização Neuropsicologia foi retirada dos metadados `curriculum_placements`, do objeto educativo e da relação do curso, sem eliminar nenhuma UC. A interface deixa de oferecer um percurso de investigação não fundamentado nessa especialização.
   - Concretizado no [PR #50](https://github.com/Open2Tech/facodi/pull/50) e na migração idempotente `20261116232500_facodi_mncn_official_completion_tracks_2026_27.sql`. A correção foi aplicada diretamente ao Supabase e validada.

2. **Unidade `15271021`: ECTS contraditórios na fonte** — o plano 2026/27 apresenta **0 ECTS** num bloco "Optativa I" e **5 ECTS** no bloco "I Livre". Estes valores ficam registados em `ects_conflicting_source_values=[0,5]` e `ects_requires_fchs_confirmation=true`. O valor original no registo é preservado por rastreabilidade, mas as interfaces apresentam **"ECTS a confirmar na UAlg"** em vez de o tratar como confirmado. A confirmação depende da faculdade.

3. **Listagens paralelas de neuroimagem** — os códigos `15261022` e `15261027` foram cadastrados como UCs próprias e assinalados como listagens de possível sobreposição com `15261037` e `15261038`. Nenhuma equivalência de créditos é assumida automaticamente. Os 120 ECTS do curso não são recalculados por soma indiscriminada das entradas.

4. **Opções e especializações** — opções aparecem organizadas por bloco; a mesma UC pode figurar em vários grupos quando assim consta do plano, mas continua a ser um único registo. Corrigido pelos PRs [#46](https://github.com/Open2Tech/facodi/pull/46) e [#49](https://github.com/Open2Tech/facodi/pull/49).

5. **Descoberta de recursos** — filtro temático de Psicologia e Neurociências alinhado entre frontend e `facodi.search_public_resources_v4`, com testes do perfil anónimo; PR [#48](https://github.com/Open2Tech/facodi/pull/48).

## Segurança e operação

Os **Supabase Advisors** foram consultados nas categorias segurança, desempenho e saúde.

- **Health:** nenhum aviso de saúde reportado.
- **`facodi.email_outbox`:** RLS ativado e sem políticas. Confirmado que `anon` não possui `SELECT` nem `INSERT`, `authenticated` não possui `SELECT` e `service_role` possui `INSERT`; manter o isolamento é intencional.
- **`facodi.review_project_credit` e `facodi.revoke_project_credit`:** funções `SECURITY DEFINER` executáveis por `authenticated`, mas não por `anon`. Ambas verificam internamente `auth.uid()` e `facodi.is_facodi_editor()`; a exposição foi revista, **não** alterada indiscriminadamente.
- Advisories adicionais no esquema compartilhado `public` (incluindo funções `SECURITY DEFINER` e extensão `vector`) **não foram alterados**: podem pertencer a outras funcionalidades do projeto e requerem auditoria isolada de contratos e dependências.
- Avisos de performance (chaves externas sem índice e políticas permissivas múltiplas) não justificaram alterações de esquema nesta entrega, dado o escopo de navegação curricular e o risco de regressões sem benchmarks.

## Validação e publicação

- O [PR #50](https://github.com/Open2Tech/facodi/pull/50) foi integrado após passar os controlos de CI e o preview Cloudflare.
- O commit de integração `089f40080ececf5076805208d0d79035ec40d98b` passou os checks GitHub, incluindo **Workers Builds: facodi** e **Verify deployed Cloudflare Workers build (read-only)**.
- O ajuste complementar de apresentação ECTS está no [PR #51](https://github.com/Open2Tech/facodi/pull/51), a integrar após CI.
- **Limitação:** a tentativa de inspecionar visualmente a SPA pública via ferramenta de navegação falhou. O smoke automatizado confirma build e acesso, mas não substitui QA visual manual.

## Pendências assumidas

- Confirmar com a UAlg a discrepância de `15271021` (0/5 ECTS) e a equivalência de listagens de neuroimagem (`15261022`/`15261027` versus `15261037`/`15261038`).
- Fazer revisão editorial e científica integral dos vídeos que tratam de terapêuticas e condições clínicas; materiais externos não constituem aconselhamento clínico.
- Tratar em trabalho separado os avisos que dizem respeito ao esquema compartilhado `public`, evitando alterações destrutivas fora do escopo FACODI.


## Atualização editorial — 17/11/2026: bibliografia e resultados de aprendizagem

### Lacunas identificadas e resolvidas

A auditoria revelou que as **62 UCs** dos cursos `LPSI` (40) e `MNCN` (22) não tinham referências `external_resource` associadas diretamente à respetiva UC. As páginas de detalhe já tinham o componente `useUnitReadings`; a correção foi de dados e **não exigiu refatoração do frontend**.

- **21 novos objetos** `facodi.learning_objects` de tipo `external_resource`, cada um com URL original de editora/instituição, descrição editorial, publicação ativa, e proveniência em `facodi.external_sources`. Um capítulo de empreendedorismo da OpenStax já existia no catálogo e foi **reutilizado**, não duplicado.
- **135 novas relações UC → leitura** com `created_by_mechanism='verified_external_reading_curation'`, `review_status='approved'` e `review_scope='external_landing_page'` (condições exigidas pela política pública de leitura). Todas as 62 UCs possuem entre duas e três leituras.
- **28 relações adicionais sequência → bibliografia** distribuídas pelas 15 sequências já existentes. Duas relações pretendidas já existiam e foram preservadas pelo conflito único; as 15 sequências mantêm vídeos, ordenação e bibliografia.
- **186 resultados de aprendizagem** em `facodi.learning_outcomes`, correspondendo aos **três objetivos editoriais já existentes** em cada uma das 62 UCs. A tabela pública era anteriormente vazia para estes cursos. Os novos resultados são **propostas da FACODI**, não resultados homologados pela UAlg, nem avaliações formais. A origem editorial foi mantida nos metadados e corresponde à política pública de leitura de `learning_outcomes`.
- O registo antigo `facodi-psych-openstax-psychology-2e` tinha a licença indicada como `CC BY 4.0`; foi corrigido para **`CC BY-NC-SA 4.0` segundo o aviso apresentado nas páginas do editor em 17/11/2026**.

### Fontes consultadas

- OpenStax, *Psychology 2e*, capítulos 1–16: <https://openstax.org/books/psychology-2e/pages/preface>. Os URLs dos 16 capítulos foram individualmente consultados no site original.
- OpenStax, *Introduction to Anthropology*, capítulo 3: <https://openstax.org/books/introduction-anthropology/pages/3-introduction>.
- OpenStax, *Writing Guide*, capítulo 10: <https://openstax.org/books/writing-guide/pages/10-introduction>.
- OpenStax, *Entrepreneurship*, capítulo 1: <https://openstax.org/books/entrepreneurship/pages/1-introduction> (reutilizado do catálogo).
- OpenStax, *Psychology 2e*, secção 16.3 sobre modalidades e terapia familiar: <https://openstax.org/books/psychology-2e/pages/16-3-treatment-modalities>.
- Noba Project, Laney e Loftus, *Eyewitness Testimony and Memory Biases*: <https://nobaproject.com/modules/eyewitness-testimony-and-memory-biases>.
- The Open University / OpenLearn, *Forensic Psychology*: <https://www.open.edu/openlearn/mod/oucontent/view.php?id=70526>.
- Foram também reutilizados os recursos já publicados de `Neuroscience Online` (UTHealth), `BrainFacts` e estatística da OpenStax.

**Direitos de autor:** só foram registados URLs públicos, títulos, nomes de capítulos e descrições editoriais originais. **Não foi copiado, re-hospedado nem ingerido em pipelines de IA qualquer texto integral protegido.** As páginas de *Psychology 2e* da OpenStax avisam expressamente sobre restrições à ingestão por sistemas de IA.

### Critérios de curadoria e QA

- Mapeamento manual de cada UC para leitura(s) com correspondência temática demonstrável, sem criar objetos por cada link repetido.
- Identificação de `teacher_approved=false` ou equivalente; nenhum vínculo representa equivalência académica oficial.
- Consulta transacional com `SET LOCAL ROLE anon`: **135 relações diretas**, **186 resultados de aprendizagem** e **62/62 UCs** com ambos os elementos visíveis; **15/15 sequências** com bibliografia pública. Sem novas políticas ou concessões de acesso.
- **Vídeos:** quatro entradas do lote `facodi_lutz_science_20261116` continuam `pending` e os seus objetos em `draft`: `KU57aScQXWg`, `1CLmXdzXlhA`, `F64USbOkE14`, `dDPs-3xSlxE`. Ocorreu validação indireta do Lutz #146, mas sem confirmação direta da página do YouTube para promoção segura. Não foi feita republicação automática dessas quatro entradas.
- Esta intervenção apenas adicionou/ajustou **dados editoriais e relações existentes**. Não foi alterado o contrato da API, o modelo relacional, a estrutura do curso, as RLS ou o frontend.

### Identificadores de auditoria

- `facodi.learning_objects.metadata.curation_batch = 'facodi_psych_neuro_readings_20261117'`
- `facodi.learning_object_relations.metadata.curation_batch = 'facodi_psych_neuro_readings_20261117'`
- `facodi.learning_outcomes.metadata.batch = 'facodi_psych_neuro_readings_20261117'`

### Reutilização de vídeos já existentes na FACODI

Uma segunda pesquisa identificou que seis vídeos divulgativos sobre Biopsicologia e Neuroimagem estavam publicados e vinculados às sequências, mas não diretamente às UCs. Foram registadas **20 novas relações públicas UC → vídeo**, distribuídas por sete vídeos existentes (seis vídeos da seleção de neurociências e o episódio **Psycholinguistics: Crash Course Linguistics #11**, ID `A5uNFKEn4_A`, já catalogado noutra área). O último foi verificado pela publicação original da CrashCourse: <https://www.youtube.com/watch?v=A5uNFKEn4_A>.

O vídeo de Psicolinguística foi também integrado, **sem cópia**, nas duas sequências de cognição (`LPSI` e `MNCN`), que passaram de quatro para **cinco vídeos cada**. Foram criadas **duas novas relações** de sequência. A seleção não implica aprovação médica nem revisão integral do conteúdo audiovisual.

Metadados utilizados: `curation_batch='facodi_psych_neuro_readings_20261117'`, `review_status='approved'`, `review_scope='title_and_channel_only'`, `full_video_reviewed=false`. A regra pública de relação exige a publicação prévia do vídeo. Consulta transacional com o papel `anon` confirmou as 20 novas relações UC-vídeo e as duas relações de sequência.

### Seis vídeos adicionais da CrashCourse publicados

Depois de verificar os títulos, o canal original, as datas disponíveis e as descrições públicas, foram acrescentados **6 vídeos da série Crash Course Psychology**, sem alojar cópias do conteúdo:

| ID YouTube | Tema e episódio |
|---|---|
| `hFV71QPvX2I` | *Psychological Research* #2 — métodos de investigação |
| `bSycdIx-C48` | *How We Make Memories* #13 — memória |
| `unWnZvXJH2o` | *Sensation and Perception* #5 — perceção |
| `8nz2dtv--ok` | *The Growth of Knowledge* #18 — desenvolvimento cognitivo |
| `UGxGDdQnC1Y` | *Social Influence* #38 — influência social |
| `R-sVnmmw6WY` | *Cognition – How Your Mind Can Amaze and Betray You* #15 — heurísticas e cognição |

Todos os vídeos estão em `facodi.youtube_videos`, ligados aos objetos `video` publicados e registados em `facodi.external_sources`. Os metadados identificam explicitamente `full_video_reviewed=false`, `copyright_rehosting_allowed=false` e materiais educacionais complementares não certificados pela UAlg.

Foram criadas **28 associações UC → vídeo** e **9 sequência → vídeo**, seguindo a semântica pública `review_status=approved` e `review_scope=title_and_channel_only`. Os vídeos foram adicionados ao fim das respetivas sequências, preservando a ordem anterior e atualizando `metadata.video_count`.

**QA com `SET LOCAL ROLE anon`, 17/11/2026:**

- **21** recursos externos novos, **135** links de bibliografia diretos e **186** resultados de aprendizagem, cobrindo as **62 UCs**.
- **45/62 UCs com vídeos diretos**, num total de **106 relações UC → vídeo**.
- **15** sequências, com **71 posições de vídeo**, nenhuma vazia e nenhuma contagem de metadados divergente.
- **137** objetos visíveis no filtro temático `psychology`.
- Os **4 vídeos da seleção Lutz com `status=pending` permanecem não publicados**; não foi inferida uma aprovação a partir de fontes de terceiros.
- Os seis vídeos provêm do canal original CrashCourse, mas não foi realizada revisão integral das suas afirmações científicas. Tratam-se de recursos didáticos de apoio e não de guias clínicos.

Fonte primária para cada recurso: `https://www.youtube.com/watch?v=<ID>`. Sem ingestão de legendas ou transcrições no Supabase.
