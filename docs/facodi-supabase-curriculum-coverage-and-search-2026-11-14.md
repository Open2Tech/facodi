# FACODI — cobertura curricular, roteiros e pesquisa no Supabase

**Auditoria:** 14/11/2026. Projeto `wvkjainfwsyiyfcmbtid`; schema `facodi`; repositório `Open2Tech/facodi`, branch `facodi`. Todas as alterações descritas nesta nota foram executadas no Supabase e registadas nas migrações SQL abaixo.

## 1. Estado verificado no PostgreSQL

| Métrica | Total |
| --- | ---: |
| Cursos publicados | 2 |
| UCs públicas no plano UAlg 2026/27 | 84 |
| UCs com materiais específicos de estudo, vídeo ou leitura | **77** |
| UCs de opção genérica com apoio de **planeamento**, sem programa específico | **7** |
| UCs públicas sem qualquer ponto de entrada, nem plano de opções | **0** |
| Objetos educativos públicos | **705** |
| Vídeos externos publicados | 564 |
| Referências externas publicadas | **55** |
| Associações de vídeos a UCs | 568 |
| Associações de leituras/planeamento a UCs | **113** |
| Objetivos editoriais de estudo já publicados | 252 |
| Percursos editoriais internos de UC, em `draft` | **84** |
| Mapas curriculares internos, em `draft` | **2** |
| Registos reais em `facodi.playlists` | 0 |

### Cobertura por licenciatura

| Curso | UCs públicas | Com material disciplinar específico | Apenas planeamento curricular |
| --- | ---: | ---: | ---: |
| Design de Comunicação (`LDCOM`) | 41 | **41** | 0 |
| Engenharia de Sistemas e Tecnologias Informáticas (`LESTI`) | 43 | **36** | **7** |

As **sete** UCs restantes do LESTI representam grupos de **escolha de opção**, não uma matéria com título ou programa definidos. O recurso correspondente liga para o [plano oficial UAlg](https://ise.ualg.pt/curso/1941/plano), com `resource_purpose='academic_planning'` e `no_syllabus_for_generic_option=true`; **não** é contado como material disciplinar.

Não confundir cobertura por recursos com validação do currículo ou progressos de estudantes. Os 84 roteiros são editoriais, não fichas oficiais da UAlg.

## 2. Fontes adicionais consultadas

Foram incorporadas **21 referências novas** para ajudar a suprir as 31 UCs anteriormente sem recursos, com **50 ligações UC→referência**. A UC `19411035` (Estágio LESTI) recebeu ainda uma associação a um material de gestão de projetos já registado, totalizando **51 novos vínculos**.

As referências são exclusivamente **ligações externas HTTPS** às páginas dos autores. Não foram importados ficheiros, livros, vídeos, PDFs ou conteúdo protegido para o servidor FACODI. Alguns dos recursos de software referem produtos comerciais e podem necessitar de licença para seguir os exercícios; os guias de consulta abertos não significam uma licença para utilizar o software.

Algumas fontes comprovadas:

- [Design Council — Framework for Innovation](https://www.designcouncil.org.uk/resources/framework-for-innovation/): metodologia de projeto e design, aplicada a Design de Comunicação, Seminário e Projeto.
- [ICoD — Código de Conduta para Designers em português](https://www.theicod.org/en/resources/news-archive/icod-code-conduct-translated-portuguese): deontologia e ética.
- [Ilford — Beginner's Guide](https://www.ilfordphoto.com/beginners-guide/): fotografia analógica.
- [Adobe InDesign — preparação de PDF para impressão](https://helpx.adobe.com/indesign/desktop/print/print-production-and-file-creation/produce-print-ready-pdf-files.html): impressão e acabamento.
- [OpenLearn — Art and visual culture](https://www.open.edu/openlearn/history-the-arts/art-and-visual-culture-medieval-modern/): cultura visual.
- [British Council — English for emails](https://learnenglish.britishcouncil.org/free-resources/business/english-emails): comunicação escrita.
- [AMD — Vivado Synthesis](https://docs.amd.com/r/en-US/ug901-vivado-synthesis): computação reconfigurável.
- [OpenLearn — Project management](https://www.open.edu/openlearn/money-business/leadership-management/project-management-the-start-the-project-journey): projetos/estágio, **não** regulamento oficial de estágio.
- [Universidade do Algarve — LESTI, plano](https://ise.ualg.pt/curso/1941/plano): escolha de UCs de opção, **não** conteúdo letivo específico.

A proveniência, a finalidade do recurso (`study_reference` ou `academic_planning`) e a ausência de verificação de licença foram preservadas nos metadados de `learning_objects`, `external_sources` e `learning_object_relations`.

## 3. Estruturas internas de apoio à curadoria

A tabela `facodi.generated_structures` contém agora **86 rascunhos**:
- `structure_type='module'`, `prompt.editorial_kind='uc_study_path'`: **84** sequências de três tópicos já registados para cada UC e contagens das referências disponíveis.
- `structure_type='curriculum_mapping'`, `prompt.editorial_kind='course_map'`: **2** panoramas curriculares ordenados por ano e semestre, preservando as opções alternativas.

Todos possuem `status='draft'`, `prompt.ai_model_executed=false`, `prompt.teacher_review_required=true` e `generated_by='facodi_deterministic_editorial_blueprint'`.

Não existem simulações de trabalhos de estudantes, modelos executados ou resultados de avaliação. Os planos não foram publicados automaticamente; a RLS mantém a tabela restrita a editores autorizados.

## 4. Pesquisa textual pública em PostgreSQL

Nova função **`facodi.search_public_catalog_v1`** com índice GIN na tabela `learning_objects`.

Assinatura:

```sql
SELECT * FROM facodi.search_public_catalog_v1(
  'fotografia',            -- texto de pesquisa
  ARRAY['video','external_resource']::text[], -- tipos ou NULL
  20,                     -- limite (máximo 50)
  0                       -- offset (máximo 1000)
);
```

A função é `SECURITY INVOKER`, não possui poderes de bypass da RLS, limita os tipos a `course`, `curricular_unit`, `video` e `external_resource`, e consulta apenas `published=true AND status='active'`.

Exemplo no frontend Supabase:

```ts
const { data, error } = await supabase.rpc('search_public_catalog_v1', {
  p_query: 'álgebra',
  p_types: ['course', 'curricular_unit', 'video', 'external_resource'],
  p_limit: 20,
  p_offset: 0,
});
```

**A função está implantada e testada, mas o ecrã de pesquisa atual da FACODI ainda não foi migrado para utilizar esta RPC.** Não implica recriar o índice em cada pesquisa, nem obter dados por service role.

## 5. Correção de permissões RLS

Antes desta fase, a policy `public_read_units_for_published_courses` exigia `status='active'` num curso publicado, mas não testava explicitamente `curricular_units.published=true`. A policy passou a exigir ambos: `published=true AND status='active'` tanto na UC como no curso. A regra do editor, baseada em `app_metadata.role`, não foi alterada.

Teste com `SET LOCAL ROLE anon` após as migrações:
- **84 UCs** visíveis;
- **705 objetos educativos** visíveis;
- **0** registos de `generated_structures` (percursos internos);
- **0** registos de `video_classifications`;
- pesquisas de Álgebra, design e Fotografia analógica retornaram resultados reais.

Não se alterou RLS nem permissões do schema partilhado `public`, nem o Supabase Auth utilizado pelo Tube.

## 6. Migrações aplicadas e versionadas

1. `20261114170917_facodi_curation_round2_21_specialized_resources_and_ua_options.sql`
2. `20261114171031_facodi_add_existing_project_resource_to_lesti_internship.sql`
3. `20261114171221_facodi_require_published_flag_for_public_curricular_unit_read.sql`
4. `20261114171428_facodi_deterministic_editorial_study_paths_84_units_2_courses.sql`
5. `20261114171544_facodi_secure_public_catalog_search_with_gin_index.sql`

Todas as migrações foram precedidas de uma simulação transacional `BEGIN ... ROLLBACK` para validar a escrita, com correção de erros de sintaxe/constraints antes da aplicação definitiva.

## 7. Segurança e trabalhos seguintes

O Security Advisor do Supabase ainda reporta avisos preexistentes no projeto partilhado: `vector` em `public`, 16 funções `SECURITY DEFINER` executáveis por `anon`, 26 executáveis por `authenticated` e proteção de passwords comprometidas por configurar. Estas pendências são do âmbito **Tube + FACODI** e não foram modificadas silenciosamente neste lote.

Também há avisos de desempenho referentes a índices não utilizados, políticas múltiplas e chaves estrangeiras sem índice; muitos pertencem a tabelas históricas do Tube, pelo que precisam de análise específica antes de serem alterados.

Próximas integrações recomendadas:
1. Ligar a página de pesquisa à RPC `search_public_catalog_v1` e medir desempenho.
2. Criar interface editorial que permita aprovar/rejeitar os 84 percursos provisórios.
3. Substituir as sete referências genéricas de plano por materiais da UC escolhida pelo estudante quando a escolha estiver definida.
4. Auditar efetivamente os vídeos e documentos em termos de disponibilidade, direitos, conteúdo e acessibilidade.
5. Testar submissões reais de playlists, classificação de vídeos e links de confirmação Auth com utilizadores de teste autorizados.

**Importante:** o conjunto de 84 rotas internas é uma estrutura para futura revisão, não 84 cursos diferentes, e o índice de pesquisa não torna automaticamente públicos documentos privados.
