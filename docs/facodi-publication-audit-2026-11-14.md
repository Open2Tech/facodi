# FACODI — auditoria da publicação do catálogo de 14/11/2026

## Resultado em produção

A publicação foi realizada no Supabase `wvkjainfwsyiyfcmbtid`, exclusivamente nas tabelas do schema `facodi` (consultas de leitura ao catálogo `public.videos`). Está ligada à aplicação em produção **https://facodi.vercel.app**.

| Indicador verificado | Quantidade |
| --- | ---: |
| Cursos públicos | 2 |
| UCs públicas do plano oficial UAlg 2026/27 | 84 |
| Guias de estudo originais de UCs | 84 |
| Vídeos externos YouTube publicamente referenciados | 519 |
| Objetos educativos públicos `facodi.learning_objects` | 605 |
| Relações públicas curso→UC + UC→vídeo | 607 |
| Associações UC→vídeo publicadas, após consolidação | 523 |
| UCs com pelo menos um vídeo aprovado por metadados | 22 |
| Classificações de vídeo aprovadas por análise de título/canal | 544 registros de classificação, incluindo histórico |
| UCs históricas não confirmadas em 2026/27, preservadas e privadas | 5 |
| Vídeos do lote inicial afastados por falta de pertinência | 9 |
| Documentos de transcrição sem validação, ainda privados | 3 |
| Submissões de playlists autorais em `facodi.playlists` | 0 |

**Importante:** os registos de classificação e os objetos educativos são entidades diferentes; não confundir os 544 registos de classificação com os 523 vínculos UC-vídeo.

A soma de ECTS de todas as linhas de uma licenciatura excede 180 porque contém **opções alternativas**. O total da licenciatura permanece 180 ECTS; a soma bruta de todas as alternativas não é válida como cálculo de um percurso individual.

## O que foi publicado

### Cursos e unidades curriculares
- LESTI — **Licenciatura em Engenharia de Sistemas e Tecnologias Informáticas** (43 UCs públicas).
- LDCOM — **Licenciatura em Design de Comunicação** (41 UCs públicas).
- Código, ano, semestre, ECTS, enquadramento e URL do plano de 2026/27 da Universidade do Algarve, quando cotejados.
- 84 roteiros **originais da FACODI** em português, com descrições e temas de estudo; expressamente **não** apresentados como as fichas oficiais da UC.

Planos consultados:
- https://ise.ualg.pt/curso/1941/plano
- https://www.ualg.pt/curso/1454/plano

### Recursos históricos de vídeo
1. Das 409 associações históricas do Tube, foram triados os títulos e canais e corrigidas associações evidentemente incompatíveis com a UC de origem.
2. Resultado: 373 vídeos distintos publicados nessa primeira etapa; 9 recursos sem pertinência segura ficaram privados.
3. O catálogo histórico `public.videos` continha ainda outros vídeos fora das playlists já associadas. Foram identificados **146 vídeos adicionais** com correspondência temática, elevando o total público a **519**.
4. As associações definitivas `facodi.unit_videos` com `review_status='approved'` são **523**. A mesma aula pode apoiar UCs diferentes; as duplicações de importação foram consolidadas quando aplicável.
5. O material é apresentado por **URL canónico YouTube e player `youtube-nocookie.com`**. A FACODI não copiou nem alojou os ficheiros de vídeo.

Top 8 UCs em número de associações:
- Análise Matemática II: 139
- Probabilidades e Estatística: 110
- Análise Matemática I: 91
- Base de Dados I: 72
- História da Arte Moderna e Contemporânea: 22
- Tipografia I: 20
- Computação em Nuvem: 18
- Aprendizagem Automática: 14

A atribuição de pertinência é **curadoria temática baseada em títulos e canais**, **não** revisão integral do conteúdo audiovisual. Metadados `review_scope='title_and_channel_only'`, `full_video_reviewed=false` e `content_license_verified=false` permitem auditoria e revisão posterior. Não se afirma que os vídeos foram integralmente vistos, transcritos, licenciados para reprodução ou oficialmente aprovados pela UAlg. Resumos genéricos da antiga IA não foram propagados como factos pedagógicos.

## Integração com o frontend

- A rota pública `/courses/:slug/units/:unit` passou a consumir **apenas os vínculos expostos pela RLS**, com origem em `learning_object_relations` e filhos publicados em `learning_objects`.
- Em cada UC, a área **«Aulas em vídeo»** apresenta um leitor do YouTube sem cookies, a fila de vídeos, o canal de origem e um link para o vídeo oficial.
- O componente valida identificadores YouTube de 11 caracteres e obtém recursos em lotes de até 60 IDs, respeitando os limites de URL do PostgREST.
- Traduções português, inglês, espanhol e francês.
- Os cursos e os recursos estão acessíveis sem autenticação; edição e classificações permanecem protegidas.

## Testes realizados

**Simulações SQL transacionais (`BEGIN … ROLLBACK`)** antes das migrações, para assegurar integridade e contagens previstas; operações efetivas gravadas em migrations. O primeiro teste de classificação detectou colisões de fontes históricas para a mesma UC/vídeo, resolvidas com `DISTINCT ON` antes da aplicação.

**Consulta de papel PostgreSQL `anon` com RLS efetiva** no Supabase:
- 2 cursos e 84 UCs visíveis;
- 605 objetos educativos visíveis;
- 607 relações públicas visíveis, incluindo 523 vídeos por UC;
- 0 classificações privadas visíveis.

**Vercel:** compilação de produção da branch `facodi` com estado `READY`; commit `471c88baa70f4169316d127677d5ce95385fff7e` após todas as migrações e a integração do player.

**Navegador de produção:** páginas verificadas com JavaScript:
- https://facodi.vercel.app/courses — as duas licenciaturas publicadas;
- https://facodi.vercel.app/courses/lesti/units/19411018 — descrição, guia de estudo, **110** vídeos e iframe de origem `youtube-nocookie.com`;
- https://facodi.vercel.app/courses/ldcom/units/14541153 — descrição, guia, **20** vídeos e iframe.

A existência do iframe e do URL YouTube foi confirmada; a reprodução de cada um dos 519 vídeos **não** foi testada individualmente (restrições de disponibilidade por proprietário e região podem existir).

## Migrações deste lote

- `20261114160054_facodi_historical_videos_title_based_publication.sql`
- `20261114160444_facodi_publish_original_84_curricular_study_guides.sql`
- `20261114160508_facodi_public_access_to_curated_learning_paths.sql`
- `20261114161458_facodi_historical_library_extra_146_curated_youtube_links.sql`

As migrações foram aplicadas no Supabase e commitadas na branch `facodi` do [Open2Tech/facodi](https://github.com/Open2Tech/facodi/tree/facodi).

## Limitações e próximas revisões editoriais

- São **22 UCs com vídeos** em 84 publicadas. As restantes **62** têm guias próprios, mas ainda não foram encontrados vídeos com pertinência suficientemente segura.
- Os vídeos de Odoo, entretenimento, notícias e temas não relacionados não foram importados para a biblioteca da FACODI.
- As **cinco UCs legadas não presentes no plano oficial 2026/27** continuam privadas.
- As **três transcrições automáticas** antigas continuam privadas até avaliação de exatidão e licença.
- `facodi.playlists` e `facodi.playlist_items` continuam sem submissões reais. As listas de vídeo das UCs são associações ao grafo educativo, **não** submissões de uma playlist por um utilizador.
- Revisão integral de aulas, acessibilidade de legendas, disponibilidade por região, direitos de incorporação e ordenação didática fina requerem curadoria complementar. O `review_status='approved'` neste lote significa **aprovado para exposição como ligação externa de apoio por correspondência temática**, não acreditação da aula pela instituição.
