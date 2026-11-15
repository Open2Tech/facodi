# FACODI — Auditoria editorial e publicação incremental

**Data:** 15 de novembro de 2026  
**Base Supabase:** `wvkjainfwsyiyfcmbtid` — schema `facodi`  
**Repositório e branch:** `Open2Tech/facodi`, `facodi`  
**Site verificado:** https://facodi.com

## Objetivo

Disponibilizar mais conteúdo **sem criar exercícios, duplicar vídeos nem alterar o catálogo canónico do Tube**. Primeiro foram auditadas as tabelas de recursos, rascunhos, sequências e ligações públicas. A intervenção usa títulos e canais dos materiais já importados, não transcrições ou notas automáticas antigas.

## Inventário antes e depois

| Indicador | Antes | Depois | Comentário |
| --- | ---: | ---: | --- |
| Vídeos FACODI publicados | 892 | **893** | Uma aula existente de vetores, antes em rascunho, foi validada pela fonte do autor |
| Objetos `playlist` publicados | 103 | **107** | Mais quatro sequências de T-SQL/SQL Server |
| Sequências públicas retornadas por `list_public_editorial_sequences_v1(NULL)` | 99 | **103** | Os demais objetos playlist externos sem itens internos não são sequências FACODI |
| Coleções públicas | 24 | **25** | Coleção de Bases de Dados SQL/T-SQL |
| `external_resource` públicos | 177 | 177 | Sem novas fontes externas nesta etapa |
| Aulas já existentes organizadas em novas sequências | — | **56 associações** | Reutilização; **não** 56 vídeos novos |
| Rascunhos de vídeos restantes | 10 | **9** | Conteúdos sem pertinência suficientemente verificada continuam privados |
| Transcrições/documentos em rascunho | 3 | 3 | Qualidade e direitos de reutilização não validados |
| Unidades curriculares legadas não publicadas | 5 | 5 | Ausentes do plano UAlg 2026/27; preservar histórico |

**Integridade:** zero referências órfãs no grafo e zero pares duplicados `(parent_object_id,child_object_id,relation_type)`. Todas as novas sequências estão públicas com RLS; sob o papel PostgreSQL `anon`, foram encontrados zero registos nas classificações privadas e zero vídeos em rascunho.

## Publicação 1 — quatro novas sequências de SQL Server

As aulas pertencem ao **canal Alessandro Trovato**, já estavam publicadas como objetos `facodi.learning_objects` com origem YouTube e foram agrupadas pela numeração original.

| URL da sequência | Aulas | Conteúdo |
| --- | ---: | --- |
| [Consultas, agregações e funções](https://facodi.com/sequences/facodi-db-sql-consultas-funcoes-2026) | 11 | Vídeos 12–18 e 20–23; a aula 19 não existe neste lote e não foi inventada |
| [Manipulação, transações e objetos](https://facodi.com/sequences/facodi-db-sql-transacoes-objetos-2026) | 17 | Aulas 24–40 |
| [Funções e manutenção](https://facodi.com/sequences/facodi-db-sql-funcoes-manutencao-2026) | 17 | Aulas 55–71 |
| [Indicadores, relatórios e backups](https://facodi.com/sequences/facodi-db-sql-casos-praticos-2026) | 11 | Aulas 74–78, 80–85; o nº 79 não foi inventado |

Estas sequências ligam-se às UCs **Bases de Dados I/II da LESTI** e **Bases de Dados I/II do CTeSP STI**, conforme o assunto. Uma [coleção de estudo de SQL/T-SQL](https://facodi.com/resources/facodi-db-study-collection-sql-server) reúne ainda as duas playlists de fundamentos que já existiam, perfazendo **seis percursos**.

Os exemplos são específicos do SQL Server/T-SQL e **não** devem ser tratados como sintaxe indiferenciada de PostgreSQL, MySQL ou outro SGBD, ou como programa oficial de qualquer UC.

## Publicação 2 — recuperação de uma aula de Vetores

- [O que são Vetores? — Parte I, Professor Douglas Maioli](https://facodi.com/resources/facodi-video-lAAfjtnc7bI).
- Original do criador: https://www.youtube.com/watch?v=lAAfjtnc7bI
- Referência no material de ensino do próprio criador: https://www.professordouglasmaioli.com.br/aulas-alg-lin-e-ga
- Aborda grandezas vetoriais, módulo, direção, sentido, operações com vetores e vetores unitários.
- A aula foi reclassificada de `draft` para `active`/`published`, com a fonte do criador e limites da revisão guardados em `metadata`.
- Foram criadas seis relações: quatro associações às UCs de **Álgebra Linear**, **Física LESTI**, **Física Ifes 1º ano** e **Matemática Aplicada CTeSP**, e duas às sequências previamente existentes de Álgebra Linear/vetores e Física/vetores.
- Metadados indicam `full_video_reviewed=false` e `copyright_rehosting_allowed=false`. Nada foi descarregado ou alojado.

Não foram publicados os outros nove vídeos em rascunho. Os títulos identificados incluem conteúdos de entretenimento, vlogs e notícias, bem como materiais sem pertinência comprovada para as UCs. A publicação automática de transcrições ainda não está autorizada pela verificação de qualidade e direitos.

## Correção de UX — coleções com sequências

Antes, a página `ResourceDetails` de uma `collection` procurava **apenas filhos de tipo `video`**. As coleções cujos filhos eram sequências `playlist` podiam aparecer como vazias apesar de conterem percursos válidos.

Agora a página consulta também `useLinkedCatalogAssets(id, 'playlist')`, apresenta os percursos na ordem de `learning_object_relations.position` e abre `/sequences/{slug}`. A lista anterior de vídeos diretos continua a funcionar. Foram incluídas traduções PT/EN/ES/FR. A consulta continua sujeita a RLS e a filtragem de `published=true`, `status='active'`, sem bypass no frontend.

## Validação

**Banco de dados:** ambas as migrações foram primeiro ensaiadas dentro de `BEGIN ... ROLLBACK`, depois aplicadas. Contagens RPC confirmadas sob `SET LOCAL ROLE anon`:

- `get_public_editorial_playlist_v2(...consultas-funcoes...)`: **11** de 11 vídeos.
- `get_public_editorial_playlist_v2(...transacoes-objetos...)`: **17** de 17.
- `get_public_editorial_playlist_v2(...funcoes-manutencao...)`: **17** de 17.
- `get_public_editorial_playlist_v2(...casos-praticos...)`: **11** de 11.
- `list_public_editorial_sequences_v1('19411012')`: **2** percursos em BD I LESTI.
- `list_public_editorial_sequences_v1('19411017')`: **4** percursos em BD II LESTI.
- `list_public_editorial_sequences_v1('18121019')`: **2** percursos em BD I CTeSP.
- `list_public_editorial_sequences_v1('18121020')`: **4** percursos em BD II CTeSP.

**Browser público `facodi.com`, sem autenticação:**

1. [Consultas e funções](https://facodi.com/sequences/facodi-db-sql-consultas-funcoes-2026) — 11 aulas pela ordem correta, link YouTube visível.
2. [Transações e objetos](https://facodi.com/sequences/facodi-db-sql-transacoes-objetos-2026) — 17 aulas exibidas, sem erros.
3. [Aula de Vetores](https://facodi.com/resources/facodi-video-lAAfjtnc7bI) — recurso público, autor correto e link original.
4. [Coleção Bases de Dados](https://facodi.com/resources/facodi-db-study-collection-sql-server) — **seis links sequenciais** visíveis e sem mensagem errónea de coleção vazia.

O browser confirmou a navegação e os links externos, **não** a reprodução integral de cada aula nem todos os tempos de início do YouTube. Não foram efetuadas operações com contas ou dados pessoais durante estes testes.

## Migrações versionadas

- `20261115210020_facodi_publish_56_existing_sql_video_lessons_four_sequences_collection_20261115.sql`
- `20261115210153_facodi_restore_verified_vectors_video_and_curate_mathematics_physics_links_20261115.sql`

## Alertas de segurança e desempenho existentes

O Supabase Advisor, após a publicação, assinalou avisos que **não foram introduzidos pelas migrações de conteúdo**, incluindo:

- **Segurança:** funções `SECURITY DEFINER` executáveis por `anon` ou `authenticated`. É necessário verificar permissões e guardas internas função a função antes de revogar ou alterar privilégios; a alteração cega pode quebrar Auth, revisão de playlists, editor e percursos.
- **RLS em `facodi.email_outbox`:** habilitado sem política; pode ser intencional para uma tabela de acesso exclusivo ao servidor. Não foi aberta uma política pública.
- **Desempenho:** algumas políticas permissivas múltiplas e chaves estrangeiras sem índice. Algumas advertências referem-se ao schema `public` e devem ser tratadas numa revisão técnica separada.

Referências de remediação:
[Supabase database lint — SECURITY DEFINER executável por utilizadores](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable);
[Supabase database lint — RLS sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy);
[Supabase database lint — políticas permissivas múltiplas](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies).

## Regras mantidas

Sem integração com Odoo, sem uploads de vídeos dos autores, sem alteração de dados em `public.videos`, sem exercícios gerados e sem matrículas ou progressos inventados. A publicitação de um vídeo significa **adequação temática por fonte e metadados**, não validação académica ou revisão integral do seu conteúdo.
