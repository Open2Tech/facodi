# FACODI — Auditoria da ordem dos vídeos e consolidação de objetos de aprendizagem

**Data:** 15/11/2026  
**Infraestrutura:** Supabase `wvkjainfwsyiyfcmbtid` / schema `facodi`; frontend `facodi.com` em **Cloudflare**.  
**Código e migrações:** branch `facodi` de `Open2Tech/facodi`.

## Objetivo e decisões

Auditar a ordem em que as aulas e materiais são apresentados, verificar duplicações de sequências e consolidar apenas objetos **realmente redundantes**, respeitando registos de progresso, contexto de curso/UC, links públicos existentes, documentação própria e regras de RLS.

O catálogo de vídeo canónico mantém-se partilhado: não foram descarregados vídeos nem criadas cópias para as diferentes UCs.

## Diagnóstico inicial

- **107 objetos `playlist` públicos**, dos quais **103 sequências editoriais com vídeos** e quatro referências externas sem lições individualmente importadas.
- Um caso anómalo: o vídeo introdutório **«O que são Vetores?»** estava na posição `1601` de uma sequência de apenas sete vídeos, depois das aulas sobre bases e transformações.
- A maioria das sequências tinha posições ordenadas, mas várias guardavam contagens `metadata.video_count` ausentes ou desatualizadas.
- **Nove módulos históricos do Ifes** tinham posições repetidas no mesmo tipo de conteúdo (entre documentos, vídeos, playlists ou referências), o que tornava a ordenação ambígua.
- Onze ligações para vídeos já publicados não eram devolvidas pela consulta pública editorial, porque faltava `review_status`/`review_scope` ou estes usavam uma terminologia diferente. Destes, **dois** tinham revisão baseada no título, descrição e material do próprio criador; **nove** não tinham os marcadores de publicação da sequência.
- O catálogo continha sequências com forte sobreposição, mas **partilhar vídeos não significa automaticamente ser o mesmo objeto pedagógico**.

## Correções aplicadas

### 1. Ordenação de playlists

Foi normalizada a sequência de posições dos vídeos associados a **103 sequências editoriais**, mantendo a ordem editorial anterior, com a exceção explícita da introdução de Vetores, que passou a surgir antes das aulas de Álgebra Linear 05–11. Os identificadores de vídeos, as ligações às UCs e os registos de progresso não foram alterados.

Os valores de `metadata.video_count` foram reconciliados com as aulas efetivamente associadas. Posições anteriores de relações alteradas foram guardadas em `metadata.previous_position_before_20261115`.

### 2. Um merge real e conservador

As sequências abaixo continham exatamente os mesmos quatro vídeos **na mesma ordem**, sem materiais exclusivos nem progresso no objeto a consolidar:

- **Canónica:** [Física — ondas, luz e física moderna](https://facodi.com/sequences/facodi-science-fisica-ondas-optica-moderna)
- **Alias histórico:** [Astronomia — luz, ondas e observação](https://facodi.com/sequences/facodi-astro-sequence-astro-luz-ondas-observacao)

O objeto canónico recebeu as relações provenientes da Astronomia: curso, UC, módulo de observação e coleção de sequências, sem duplicar os vídeos.

O alias mantém-se publicado apenas para **redirecionar URLs guardados**. Guardou-se um snapshot de proveniência das quatro aulas e das quatro relações anteriores em `metadata.original_video_links` e `metadata.original_parent_links`; as relações redundantes foram retiradas depois da transferência. `get_public_editorial_playlist_v2` resolve o alias; `list_public_editorial_sequences_v1` e `search_public_resources_v4` excluem o alias dos resultados públicos.

**Resultado:** **102 sequências editoriais distintas**, sem URLs quebrados.

### 3. Objetos que não foram fundidos

A sequência geral de Cálculo e a sequência CTeSP Matemática Aplicada partilham os mesmos nove vídeos, mas a segunda contém **um guia de estudo e um exercício resolvido próprios**; a primeira já tem **nove registos de progresso**. Uma fusão apagaria contexto académico ou exigiria migração explícita de materiais/progresso, por isso **não foi realizada**.

Situação semelhante ocorre com sequências de Funções para Ifes/Análise, que apresentam documentos ou atividades contextuais diferentes; foram mantidas como reutilização legítima do mesmo conjunto de vídeos. A semelhança de títulos ou a sobreposição de vídeos, por si só, não autoriza deletar objetos.

### 4. Ordenação de módulos do Ifes

Foram corrigidos **nove módulos históricos** com posições ambíguas. Dentro de cada módulo, as relações `contains` foram ordenadas com critério estável: posição antiga, data de criação da relação e identificador. Mantiveram-se os objetos, IDs e relações originais, guardando `metadata.previous_position_before_20261115` nos itens efetivamente reposicionados.

### 5. Conciliação editorial e ordem pedagógica

Foram revistos **11 vínculos de vídeo** já existentes, reconciliando `review_status='approved'` e `review_scope='title_and_channel_only'` para que a consulta pública os possa apresentar. Preservou-se a proveniência anterior em metadados separados e manteve-se `full_video_reviewed=false`. **Não foi afirmada revisão integral, verificação de licenças de reprodução ou aprovação pelas universidades.**

As posições de **35 vídeos** foram reorganizadas em quatro sequências:

| Sequência | Aulas públicas | Primeiros temas |
| --- | ---: | --- |
| [Álgebra Linear — bases e transformações](https://facodi.com/sequences/facodi-math-algebra-vetores-transformacoes) | 7 | Vetores introdutórios, espaço vetorial, bases e transformações |
| [Git, GitHub e colaboração](https://facodi.com/sequences/facodi-playlist-git-fundamentos-colaboracao) | 10 | Definição de Git, versionamento, operações, colaboração e CI/CD |
| [Python — introdução e ambientes](https://facodi.com/sequences/facodi-playlist-python-iniciacao-ambientes) | 12 | Curso Python #01, #02, #04, tipos de dados, operadores, exemplos, ambientes e testes |
| [SQL e bases de dados relacionais](https://facodi.com/sequences/facodi-playlist-sql-relacional-fundamentos) | 9 | Conceito de BD, modelação, criação de BD e tabelas, chaves, consultas e joins |
| [Física — vetores e cinemática](https://facodi.com/sequences/facodi-science-fisica-vetores-cinematica) | 4 | Introdução aos vetores, operações, cinemática e velocidade instantânea |

Em Python, permanecem vídeos gravados de resolução de exercícios **do autor original**: não são exercícios novos criados pela FACODI. Em SQL, materiais MySQL e SQL Server estão identificados pelo canal e pela tecnologia: **não** são apresentados como linguagens totalmente equivalentes.

## Resultados técnicos finais

| Indicador | Estado verificado |
| --- | ---: |
| Sequências editoriais distintas visíveis publicamente | **102** |
| Objetos `playlist` físicos publicados, incluindo alias e referências externas | **107** |
| Vídeos publicados | **893** |
| Entradas únicas em `facodi.youtube_videos` | **900 / 900** |
| Módulos históricos com ordem corrigida | **9** |
| Vínculos de vídeo tornados visíveis por harmonização editorial | **11** |
| Ligações de vídeos com reordenação pedagógica auditada | **35** |
| Vídeos das 102 sequências com diferenças entre contagem física/aprovada | **0** |
| Metadados `video_count` divergentes nas sequências canónicas | **0** |
| Posições repetidas no mesmo tipo de material em módulos públicos | **0** |
| Relações órfãs / relações duplicadas no grafo | **0 / 0** |
| URLs de vídeo canónicos duplicados | **0** |
| Entradas de progresso em `facodi.editorial_playlist_progress` preservadas | **15** |

A simulação de `anon` confirmou a disponibilidade das sequências, sem conceder `SELECT` público à tabela de progresso e sem expor objetos em rascunho. As funções públicas atualizadas mantêm as assinaturas, autorização e semântica **SECURITY INVOKER** existentes.

## Migrações desta auditoria

- `20261115213910_facodi_20261115_normalize_103_editorial_playlist_positions_and_video_counts.sql`
- `20261115214404_facodi_20261115_consolidate_exact_physics_astro_light_sequence_preserve_alias.sql`
- `20261115214704_facodi_20261115_normalize_9_ifes_study_module_orders.sql`
- `20261115215511_facodi_20261115_align_11_reviewed_video_sequence_links_with_public_reader.sql`
- `20261115215548_facodi_20261115_reorder_35_existing_git_python_sql_physics_video_lessons.sql`
- `20261115215948_facodi_20261115_hide_canonical_playlist_alias_from_public_catalogue.sql`

## Validação e regressões

Foram usadas transações de pré-validação `BEGIN ... ROLLBACK` antes de cada migração. Os testes com função e papel `anon` e as consultas de integridade foram executados depois da publicação.

**Cloudflare:** o navegador abriu o URL antigo de Astronomia e confirmou o redirecionamento para a sequência de Física com quatro aulas. Confirmou também a ordem e a quantidade de aulas de Álgebra (7), Git (10), Python (12) e SQL (9), sem autenticação e sem erros de interface.

Foi adicionado o teste de regressão **[`scripts/audits/facodi_catalog_integrity.sql`](../scripts/audits/facodi_catalog_integrity.sql)**, que corre em modo **read-only** e valida ordenação, exposição pública, metadados, redirecionamentos, duplicações, privilégios e privacidade. A execução da versão atual do teste passou.

Não houve deploy na Vercel. O teste público não exigiu utilização da conta de testes nem operações sobre dados pessoais.

## Limitações e próximos cuidados

- A aprovação das 11 ligações corresponde a curadoria por **título, canal e contexto existente**, não visualização integral das aulas.
- A preservação dos objetos pedagógicos com materiais distintos evita perda de ementas, histórico e progresso; futuros merges devem passar pelos mesmos critérios e exigir migração cuidadosamente planeada.
- Uma evolução útil é criar interface editorial para **arrastar e reordenar** vídeos com pré-visualização, controlo de concorrência e validação de permissão por editor, em vez de editar posições manualmente no banco.
- Validar regularmente disponibilidade dos vídeos, legendas, descrições e licenças de incorporação, sem copiar conteúdos que pertencem aos autores.
