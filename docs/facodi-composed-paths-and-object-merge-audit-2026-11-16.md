# FACODI — Composição conservadora de percursos e auditoria de merges (16/11/2026)

## Âmbito

Piloto anterior de Estatística do Ifes (`facodi_study_path_v1`) permanece independente. Esta proposta introduz `facodi_study_path_v2` como **metadado de apresentação** em cinco unidades curriculares, sem nova tabela de recursos, sem copiar vídeos, sem alterar ligações `contains`, sem transferir progresso e sem reescrever URLs.

Unidades abrangidas:
- LESTI — Ambientes de Desenvolvimento Colaborativo (`19411001`)
- CTeSP STI — Ambientes de Desenvolvimento Colaborativo (`18121017`)
- LESTI — Análise Matemática I (`19411002`)
- LESTI — Análise Matemática II (`19411008`)
- LESTI — Probabilidades e Estatística (`19411018`)

## Diagnóstico dos vídeos e motivo para conservar a biblioteca

| Unidade | Vídeos diretos | Presentes em playlists | Fora das playlists |
| --- | ---: | ---: | ---: |
| LESTI — Ambientes colaborativos | 30 | 25 | **5** |
| CTeSP — Ambientes colaborativos | 25 | 24 | **1** |
| Análise Matemática I | 244 | 42 | **202** |
| Análise Matemática II | 141 | 41 | **100** |
| Probabilidades e Estatística | 112 | 64 | **48** |

**Não é seguro esconder a lista de vídeos por completo**: dezenas/centenas de itens só existem diretamente na UC. A biblioteca antiga fica sob um painel nativo `details`, recolhido por defeito mas totalmente acessível, incluindo o leitor e as ligações originais.

## Semântica educacional

- **Curso/UC** continuam a representar o currículo.
- **Secções** de `facodi_study_path_v2` são apenas agrupamentos editoriais localizados, não novos learning objects.
- Cada secção aponta para playlists públicas `facodi-owned` preexistentes. Não altera a ordem ou a pertença dos vídeos.
- O progresso continua por playlist/vídeo em `facodi.editorial_playlist_progress`, através da página `/sequences/:slug`, e **não** é apresentado como progresso conjunto da UC.
- Os módulos associados mantêm identidade própria e surgem como **guias e atividades**.
- As playlists suplementares continuam disponíveis e não são substituídas por novas cópias.
- Se a lista pública de playlists/módulos divergir dos metadados, a UC recua para a apresentação antiga e mantém o acesso a todos os conteúdos.

## Auditoria de fusões físicas

A pesquisa por **sequências de vídeos exatamente iguais e na mesma ordem** só encontrou três pares adicionais após a fusão histórica de Física/Astronomia:

1. **Análise Matemática I — limites, derivadas e integração** e **CTeSP — Matemática Aplicada e cálculo**: nove vídeos idênticos; a variante CTeSP tem dois materiais não-vídeo adicionais e a sequência geral tem nove registos de progresso.
2. **Funções, domínio e gráficos** e **Ifes — funções, gráficos e progressões**: oito vídeos idênticos; ambas têm materiais não-vídeo próprios.
3. **Ifes — Juros simples e compostos** e **Matemática Financeira — juros simples e compostos**: três vídeos idênticos; a segunda sequência inclui dois materiais não-vídeo.

Decisão: **zero fusões físicas seguras nesta ronda**. Não remover objetos, não promover aliases, não transferir `editorial_playlist_progress`. Os mesmos vídeos são reutilizados, em objetos pedagógicos distintos. A deduplicação é **visual**, na UC, não de identidade.

## Implementação e segurança

- Configuração validada em `src/entities/course/composedStudyPath.ts`, com detecção de slugs repetidos ou inválidos e comparação exata das playlists/módulos disponíveis.
- `UnitComposedStudyPath` cria uma navegação única com secções e links às playlists existentes, sem inventar uma playlist geral.
- `UnitVideoLibraryFrame` deixa todos os vídeos diretos acessíveis num painel recolhível.
- Migração `20261116221000_facodi_5_units_composed_study_paths_no_merge.sql`, estritamente DML, verifica curso, UC, playlists públicas, módulos e conflitos com composição anterior antes de gravar `metadata`.
- Migração simulada com `BEGIN ... ROLLBACK` com sucesso para as cinco UCs.
- Nenhuma alteração a RLS, funções RPC, tabelas, identidade de conteúdos, ou progresso.

## Verificações antes de merge/deploy

Executar `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`; validar que o CI global não seja confundido com a falha pré-existente de `scripts/enrichment/youtube-data-api-utils.test.mjs` executado por Vitest.

Percorrer em anónimo e autenticado as cinco UCs; confirmar 3/4 secções com playlists, links de guias, biblioteca de vídeos acessível, progressos antigos nas sequências e que Estatística Ifes / outras UCs continuam sem alteração. Confirmar traduções, navegação móvel, Cloudflare e rollback.

### Reversão

Sem perda de dados: remover apenas a chave `facodi_study_path_v2` da `metadata` das cinco UCs e/ou reverter o código do frontend. Todas as playlists, módulos, relações e progressos permanecem iguais.
