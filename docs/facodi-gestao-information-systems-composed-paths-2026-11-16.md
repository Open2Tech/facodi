# FACODI — Sistemas de Informação para Gestão I e II: percursos compostos

**Data:** 16/11/2026  
**Curso:** Licenciatura em Gestão, UAlg (`LGEST`)  
**Âmbito:** `14181196` e `14181197`

## Diagnóstico do catálogo existente

| Unidade | Playlists públicas existentes | Módulos já publicados | Vídeos ligados diretamente | Vídeos diretos fora das playlists |
| --- | ---: | ---: | ---: | ---: |
| Sistemas de Informação para Gestão I | 6 | 3 | 15 | 0 |
| Sistemas de Informação para Gestão II | 12 | 5 | 22 | 0 |

O conjunto de vídeos das playlists é de 23 (I) e 45 (II) objetos distintos. Há sobreposição de vídeos em vários percursos, mas não duplicação física demonstrada. As playlists `facodi-odoo19-financas-despesas`, `facodi-tecnologia-odoo-integracoes` e `facodi-odoo19-servicos-helpdesk` possuem registos de progresso; **não podem perder identidade**.

A página das unidades ainda mostra os recursos em vários blocos alternativos sem uma leitura curricular única. O objetivo é reaproveitar o mecanismo `facodi_study_path_v2` que já existe no frontend, sem desenvolver novos tipos de learning object.

## Organização proposta

### Sistemas de Informação para Gestão I

1. **Fundamentos de ERP e processos de gestão** — `facodi-odoo19-visao-geral`, `facodi-playlist-processos-sistemas-gestao`.
2. **Fluxos financeiros, despesas e reembolsos** — `facodi-playlist-despesas-reembolso-erp`, `facodi-odoo19-financas-despesas`.
3. **Gestão de pessoas e operações empresariais** — `facodi-playlist-rh-cadastro-erp`, `facodi-odoo19-operacoes-frota`.

Os três módulos existentes de fundamentos, operações e finanças permanecem disponíveis como **guias e atividades**.

### Sistemas de Informação para Gestão II

1. **Integração de sistemas e processos digitais** — `facodi-tecnologia-odoo-integracoes`, `facodi-playlist-processos-sistemas-gestao`.
2. **Aprovações, despesas e atendimento** — `facodi-odoo19-operacoes-aprovacoes`, `facodi-odoo19-financas-despesas`, `facodi-odoo19-operacoes-rececao`.
3. **Serviços, suporte e operações** — `facodi-odoo19-servicos-helpdesk`, `facodi-odoo19-operacoes-frota`, `facodi-odoo19-operacoes-refeicoes`.
4. **Processos transversais de recursos humanos** — `facodi-playlist-rh-cadastro-erp`, `facodi-playlist-rh-recrutamento-erp`, `facodi-playlist-rh-assiduidade-erp`.

A playlist de visão geral de ERP fica disponível como conteúdo complementar de revisão, evitando repetir a introdução de Sistemas I. Os cinco módulos associados continuam listados como materiais de apoio.

Estes percursos são **propostas editoriais da FACODI**: não se apresentam como programa oficial da universidade nem formação oficial Odoo, e não afirmam validação integral dos vídeos.

## Integridade da migração

`supabase/migrations/20261116230000_facodi_gestao_information_systems_composed_study_paths.sql`

A migração:
- altera apenas `facodi.curricular_units.metadata.facodi_study_path_v2` das duas UCs;
- verifica curso e UCs publicados e ativos, conjunto completo e exato de playlists públicas, módulos e ausência de configuração v1/v2 conflituante;
- não cria nem apaga learning objects, módulos, playlists, relações ou vídeos;
- não transfere progresso, não altera URLs, RLS ou posições de vídeo;
- é idempotente (não regrava metadados idênticos);
- tem reversão pela remoção exclusiva da chave `facodi_study_path_v2` das duas UCs.

**Teste read-only:** `BEGIN; ... ROLLBACK;` executado com sucesso, apresentando três secções e nenhum suplemento para Sistemas I e quatro secções e um suplemento para Sistemas II.

## QA antes de expandir

Após merge, aplicar a migração no Supabase e verificar em `/courses/gestao/units/14181196` e `/courses/gestao/units/14181197` a apresentação de três/quatro secções, todos os módulos e playlists, links para `/sequences/:slug`, progresso autenticado, biblioteca de vídeos recolhível, links diretos de vídeo, tradução PT/EN/ES/FR e layout mobile.

Não fazer fusões físicas ou alterações de ordenação sem uma revisão própria, com snapshot, análise de links/progresso e plano de rollback.
