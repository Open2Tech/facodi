# FACODI — estabilidade de carregamento de percursos compostos

**Problema:** uma UC com `metadata.facodi_study_path_v2` apresenta temporariamente as secções antigas (módulos, playlists, biblioteca completa e sequência), porque a validação `canPresentComposedStudyPath` depende de três queries assíncronas. Depois do carregamento, esses blocos desaparecem e surge o percurso novo, provocando deslocações de layout e confusão.

**Correção mínima:** quando existe a configuração v2 válida, mas pelo menos uma query ainda está em `pending`, a UC mantém o título e mostra um único placeholder `aria-busy` no lugar do percurso. As listas antigas não são renderizadas durante esse breve período.

Ao concluir as queries:
- **Todas com sucesso e listas consistentes:** mostrar o percurso composto com sequências e módulos existentes, biblioteca original recolhível.
- **Qualquer query com erro ou desvio editorial:** fallback para o catálogo antigo completo; nada é escondido.
- **UC sem v2 ou com v1:** comportamento prévio sem alteração.

A lógica de espera é pequena, em `isComposedPathPending`, com teste unitário para `pending`, `error`, `success` e ausência de configuração. Não altera Supabase, RLS, schema, dados educativos, progresso, nem introduz novos tipos de learning object.

## Auditoria de expansão: Psicologia e Neurociências

Os cursos `LPSI` e `MNCN` têm geralmente **1–2 playlists por UC**. Não é aconselhável criar `facodi_study_path_v2` em massa para apenas repetir duas playlists noutra camada. Os objetos são reutilizados legitimamente em várias UCs.

Candidata de maior interesse para revisão pedagógica futura: `MNCN:15261024`, *Neuropsicologia e Patologias do Sistema Nervoso*, com três playlists (`neurónios/sinapses`, `avaliação neuropsicológica`, `neurofarmacologia/psiquiatria`) e **um vídeo direto ausente dessas playlists**. As três listas têm 12 aparições no total, mas apenas 9 vídeos distintos. Antes de qualquer composição, deve confirmar-se a pertinência do vídeo avulso e a sobreposição de conteúdos.

Outras UCs com dois percursos e alguns vídeos diretos exclusivos incluem `MNCN:15261023`, `MNCN:15261020` e `LPSI:14521015`. Manter as listas existentes e os vídeos diretos acessíveis, sem eliminar nem fundir objetos.

**Decisão:** nenhum merge físico e nenhuma migração curricular nesta ronda; corrigir primeiro o UX transversal. A consolidação de conteúdos requer verificação de objetivos, materiais exclusivos e progresso, não apenas coincidência de vídeos ou títulos.

## QA antes de merge

- `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.
- Abertura de `/courses/gestao/units/14181196` e `14181197` com rede lenta: nunca mostrar o layout antigo antes do novo percurso.
- Abertura de `/courses/gestao/units/14181187` e das unidades LESTI com v2: conferir fallback e biblioteca.
- Preservar `?v=<id>` e `#unit-resources`, e secções antigas nas UCs sem configuração v2.
- Sem bloqueio de navegação quando a obtenção das playlists falha: fallback para o catálogo antigo.
