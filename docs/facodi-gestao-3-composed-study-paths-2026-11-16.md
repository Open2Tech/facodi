# FACODI — Percursos compostos nas UCs de Gestão (16-11-2026)

## Objetivo e âmbito

Continuação dos pilotos de Estatística do Ifes e das cinco UCs de LESTI/CTeSP.
A migração `20261116225000_facodi_gestao_3_units_composed_study_paths.sql` aplica **apenas metadados de apresentação** `facodi_study_path_v2` a três UCs publicadas do curso UAlg `LGEST`.

| UC | Código | Playlists públicas | Vídeos diretos | Vídeos diretos apenas fora das playlists |
| --- | --- | ---: | ---: | ---: |
| Gestão de Recursos Humanos | 14181094 | 11 | 25 | 0 |
| Estatística I | 14181187 | 4 | 25 | 0 |
| Estatística II | 14181191 | 6 | 21 | 0 |

Os vídeos podem estar em várias playlists da UC. Não são cópias físicas nem justificação para fusão.

## Composição pedagógica

### Estatística I
1. Dados, gráficos e estatística descritiva — `facodi-math-estatistica-descritiva`.
2. Probabilidades, eventos e teorema de Bayes — `facodi-math-probabilidade-bayes`.
3. Variáveis aleatórias e distribuições — `facodi-math-probabilidade-distribuicoes`.
4. Complementar: `facodi-gestao-sequencia-estatistica-i` (25 vídeos, **contém registo de progresso**).

### Estatística II
1. Inferência e intervalos de confiança — `facodi-math-estatistica-intervalos`.
2. Testes de hipóteses — `facodi-math-estatistica-testes`.
3. Regressão, correlação e ANOVA — `facodi-math-estatistica-regressao`, `facodi-math-estatistica-anova`.
4. Complementares: `facodi-math-probabilidade-distribuicoes` (revisão) e `facodi-gestao-sequencia-estatistica-ii` (revisão global).

### Gestão de Recursos Humanos
1. Cadastro, competências e recrutamento — `facodi-playlist-rh-cadastro-erp`, `facodi-playlist-rh-recrutamento-erp`.
2. Assiduidade, férias e desempenho — `facodi-playlist-rh-assiduidade-erp`, `facodi-playlist-rh-desempenho-erp`.
3. Contratos e remunerações — `facodi-playlist-rh-remuneracoes-erp`.
4. Complementares: seis playlists `facodi-odoo19-rh-*` como demonstrações específicas no Odoo 19.
5. Guias pré-existentes: `facodi-modulo-odoo19-rh-selecao` e `facodi-modulo-odoo19-rh-tempo`.

As três UCs reutilizam a mesma vista `UnitComposedStudyPath` existente. Nenhum componente ou sistema novo de progresso é necessário. A biblioteca direta mantém-se disponível via painel recolhível e links `?v=`/âncoras.

## Integridade e aplicação

- **Nenhuma fusão de learning objects, exclusão de relações ou atualização de posições de vídeos.**
- O número de sequências públicas e o conjunto exato de slugs são comparados aos vínculos publicados, incluindo suplementos.
- A configuração da UC só é escrita se não existir outra versão conflituante; a migração é repetível/idempotente.
- Os módulos públicos são comparados ao conjunto completo de guias da UC; se houver diferença, toda a transação falha.
- Aplicação simulada com `BEGIN ... ROLLBACK` com sucesso: 3 secções por UC; 1, 2 e 6 sequências complementares, respetivamente.
- **Não aplicar a migração antes de merge e verificação dos checks CI**. O conteúdo é DML compatível com a branch `facodi`.

## Validação visual após merge

Páginas:
- `/courses/gestao/units/14181187`
- `/courses/gestao/units/14181191`
- `/courses/gestao/units/14181094`

Verificar (anónimo e autenticado) carregamento completo, três secções por UC, cada playlist apenas numa área principal/complementar, links de guias, labels PT/EN/ES/FR, acesso à biblioteca direta e progresso antigo das sequências. Confirmar layout mobile, teclado, links profundos e ausência de mensagens de loading persistentes.

**Reversão:** remover apenas `facodi_study_path_v2` de `facodi.curricular_units.metadata` das três UCs; a ausência dessa propriedade restabelece automaticamente o layout anterior, preservando grafo, IDs, histórico, notas e progresso.
