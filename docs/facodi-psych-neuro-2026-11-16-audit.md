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
