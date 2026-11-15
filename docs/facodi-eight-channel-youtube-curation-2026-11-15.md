# FACODI — curadoria de oito canais YouTube e playlists externas

**Data:** 15/11/2026  
**Supabase:** projeto `wvkjainfwsyiyfcmbtid` / schema `facodi`  
**Repositório:** `Open2Tech/facodi`, branch `facodi`  
**Página pública:** https://facodi.vercel.app/courses  
**Importação:** `20261115113410_facodi_eight_creator_channels_63_video_references_and_4_playlists.sql`  
**Manifesto versionado:** `supabase/seeds/facodi_creator_channels_20261115.json`

## Resultado da importação e reconciliação

O usuário solicitou ampliar os cursos FACODI com conteúdos de oito canais específicos. Foram pesquisados os títulos e IDs reais de vídeos em índices públicos dos canais, assim como playlists referenciadas por resultados e páginas originais do YouTube. A seleção foi reconciliada com os seis cursos públicos e suas 256 UCs antes de aplicar a migração.

| Resultado | Contagem |
| --- | ---: |
| Canais referenciados | 8 |
| Vídeos distintos identificados | 63 |
| **Novos registos** `facodi.youtube_videos` + `learning_objects` | **59** |
| Vídeos existentes reutilizados sem duplicar | 4 (Fabio Akita) |
| Relações vídeo–UC pretendidas | 152 |
| **Relações vídeo–UC novas** | **149** |
| Relações pré-existentes reutilizadas | 3 |
| UCs com pelo menos uma associação nova | 46 |
| Novas coleções editoriais FACODI | 8 |
| Playlists externas referenciadas pelo título e URL | 4 |
| Relações UC→playlist externa criadas | 12 |
| Novas fichas de proveniência `facodi.external_sources` | 59 |

O resultado foi confirmado por consultas SQL e pela simulação com `SET LOCAL ROLE anon`: as oito coleções, quatro playlists, 149 novas relações vídeo–UC e doze relações UC→playlist aparecem a utilizadores públicos, enquanto continua a aplicar-se a RLS da base de dados.

### Repartição das 149 associações vídeo–UC novas

| Curso | Vídeos distintos relacionados | Relações novas | UCs abrangidas |
| --- | ---: | ---: | ---: |
| LESTI — Engenharia de Sistemas e Tecnologias Informáticas, UAlg | 36 | 55 | 17 |
| Técnico em Administração, Ifes Cariacica | 26 | 39 | 10 |
| CTeSP Sistemas e Tecnologias de Informação, UAlg | 27 | 31 | 11 |
| Licenciatura em Gestão, UAlg | 9 | 9 | 3 |
| Licenciatura em Design de Comunicação, UAlg | 4 | 8 | 2 |
| Licenciatura Letras Inglês, UFES | 7 | 7 | 3 |

Os valores são **incrementais desta importação**, não os totais de vídeos de cada curso.

## Os oito canais

| Handle solicitado | Identificação e enquadramento | Aplicação curricular |
| --- | --- | --- |
| [@henriquecaldeira](https://www.youtube.com/@henriquecaldeira) | Estranha História, por Henrique Caldeira | História, contexto cultural, estudo crítico de fontes e referências literárias |
| [@GutoGalego](https://www.youtube.com/@GutoGalego) | Augusto Galego | Backend, bases de dados, segurança, arquitetura, desenvolvimento, IA |
| [@Akitando](https://www.youtube.com/@Akitando) | Fabio Akita | Arquitetura de computadores, web, cloud, engenharia de software e empreendedorismo |
| [@CiênciaSemFim](https://www.youtube.com/@Ci%C3%AAnciaSemFim) | Ciência Sem Fim, entrevistas de divulgação científica | Física, ciência, inteligência artificial (contexto e discussão, não aula formal) |
| [@PlanoPiloto](https://www.youtube.com/@PlanoPiloto) | Plano Piloto | Geografia, cartografia, história e estatística como leituras contextuais |
| [@prof.alineelias](https://www.youtube.com/@prof.alineelias) | Professora Aline Elias | Excel e produtividade, dados, gráficos, filtros e planilhas |
| [@ProgramadorLhama](https://www.youtube.com/@ProgramadorLhama) | Programador Lhama | Python, desempenho, FastAPI, arquitetura limpa e padrões |
| [@oalgoritmodaimagem](https://www.youtube.com/@oalgoritmodaimagem) | O Algoritmo da Imagem | Semiótica, cultura visual, leitura crítica de representações |

Uma correção conceptual relevante: Augusto Galego não é um canal de história, e “O Algoritmo da Imagem” não trata primariamente de algoritmos de visão computacional. Foram respeitados os temas efetivos para não criar associações falsas.

## Playlists externas com URL e título confirmados

1. [Fabio Akita — Como Computadores Funcionam?](https://www.youtube.com/playlist?list=PLdsnXVqbHDUcQIuiH9b-i9A85H3A2ZW5W)
2. [Programador Lhama — Clean Architecture em Python (Remake)](https://www.youtube.com/playlist?list=PLAgbpJQADBGK0opZ8ZuDX3zDjQck_QKMy)
3. [Professora Aline Elias — Dicas rápidas: Excel](https://www.youtube.com/playlist?list=PLLPRg8ARati5iIt6F6lgaRrqBogN6X_KD)
4. [Professora Aline Elias — Excel na Prática](https://www.youtube.com/playlist?list=PLLPRg8ARati6JGVlsQq24b--fqz6CFzax)

O título e URL foram confirmados nas páginas YouTube das playlists. **Não** se afirmou que a playlist é definitivamente administrada pelo canal mencionado nem que todos os seus itens foram auditados. Os metadados explicitam `playlist_owner_verified=false`, `playlist_membership_verified=false`; a playlist externa é apenas uma referência, sem extrair automaticamente os seus membros.

As **oito coleções** adicionais não são essas playlists: são seleções próprias da FACODI de vídeos individuais do mesmo canal, identificadas como `collection` com `owner='FACODI'`. A proveniência de cada vídeo está no YouTube; não foram copiados vídeos nem inferidas licenças para redistribuição.

## Modelagem e idempotência

A importação preservou o catálogo Tube em `public` e trabalhou apenas no schema `facodi`, usando:
- `learning_objects` para vídeos, playlists externas e coleções FACODI;
- `youtube_videos` como catálogo de IDs e URLs originais;
- `learning_object_relations` para relações aprovadas por correspondência temática de título, com `review_scope='title_and_channel_only'`;
- `external_sources` para fichas de proveniência.

A migração não usa UUIDs aleatórios: a identidade dos objetos é determinística e as inserções são tolerantes a conflitos. A chave única de fontes `(source_type,external_id)` revelou quatro fontes de Fabio Akita existentes durante a primeira simulação, que falhou e foi revertida na transação; a migração final reutiliza-as com `ON CONFLICT DO NOTHING`. Antes de aplicar, foram validados 63 IDs YouTube únicos de 11 caracteres, existência de todos os códigos das UCs, cursos publicados e metadados de proveniência. A migração concluída passou na simulação `BEGIN…ROLLBACK` e em produção.

### Navegação no frontend

- `src/features/courses/queries/useLinkedCatalogAssets.ts`: consulta paginada em blocos, RLS, sem divulgação de objetos privados.
- `src/pages/CourseDetails.tsx`: mostra coleções temáticas FACODI vinculadas ao curso.
- `src/pages/UnitDetails.tsx`: mostra playlists originais vinculadas à UC, com aviso de proveniência.
- Textos em português, inglês, espanhol e francês estão nos quatro ficheiros de traduções.

## Limitações de curadoria e próximos controlos

A correspondência temática foi feita com os títulos e contexto dos canais, não com uma revisão integral do conteúdo. Não substitui ementa ou bibliografia institucional, e não significa aprovação da universidade ou vínculo formal com o criador. Podcast, shorts, documentário, discussão técnica e vídeo didático têm finalidades pedagógicas diferentes.

As referências dependem de o canal original manter cada URL disponível. É conveniente executar revisões editoriais e verificações periódicas de URLs, além de inspeção de acessibilidade, legendas e qualidade antes de as recomendar como componente essencial de um programa académico.

Os vídeos foram inseridos como links públicos e reutilizados entre várias UCs quando pertinente; 63 vídeos identificados **não** significa 63 vídeos inéditos na internet nem 63 aulas completas.
