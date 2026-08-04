# FACODI Frontend Audit — staging-v1 — 2026-08-04

## Resumo executivo

Esta auditoria ampliou a verificação da primeira auditoria da homepage para a superfície pública do FACODI: shell do website, homepage, catálogo, pesquisa, páginas institucionais, autenticação anônima, erros públicos e os templates protegidos de curso, aula, perfil e portal. A implementação dos P1 já começou na `staging-v1`.

O resultado confirma uma customização visual forte na homepage e no shell, mas cobertura incompleta nos componentes nativos do Odoo 19. Os maiores riscos são a propagação incompleta do commit da homepage, estados standard Odoo em inglês, possível renderização incompleta do login, heranças QWeb frágeis e drift entre classes XML e SCSS.

As correções implementadas até agora estão limitadas a heranças QWeb do addon. Nenhum código do Odoo core, dado ou configuração externa foi alterado.

### Resumo de progresso

| Estado | Quantidade | Escopo atual |
| --- | ---: | --- |
| Total | 50 | Itens AUD-001 a AUD-050. |
| Open | 43 | Itens ainda sem correção iniciada ou sem decisão de implementação. |
| In progress | 0 | Nenhuma correção parcialmente aplicada. |
| Fixed | 5 | AUD-003, AUD-004, AUD-005, AUD-008 e AUD-012 corrigidos no addon. |
| Verified | 1 | AUD-002 confirmado funcionalmente no DOM público; styling pós-deploy ainda pendente. |
| Blocked | 1 | AUD-001 depende do pipeline/atualização do staging. |
| Deferred | 0 | Nenhum item adiado formalmente. |

### Contagem inicial por severidade

| Severidade | Quantidade | Observação |
| --- | ---: | --- |
| P0 | 0 | Não foi observado bloqueio geral de navegação pública. |
| P1 | 5 | Login, erros públicos, propagação, duplicação QWeb e risco de herança. |
| P2 | 11 | Cobertura visual, tradução, responsividade e manutenção relevantes. |
| P3 | 8 | Refinamentos, consistência editorial e acessibilidade. |
| P4 | 3 | Melhorias futuras ou decisões de produto. |

As contagens são itens de auditoria, não tarefas já implementadas.

## Superfície auditada

### Confirmada no staging

| Rota | Estado | Viewports observados |
| --- | --- | --- |
| `/` | Homepage pública com cursos publicados | Desktop amplo; baseline anterior da homepage disponível. |
| `/slides` | Catálogo com três cursos publicados | Snapshot público; mobile e demais viewports precisam de coleta sistemática. |
| `/website/search?search=zzzzzz` | Pesquisa sem resultados | Snapshot público. |
| `/sobre` | Página institucional | Snapshot público. |
| `/manifesto` | Página institucional | Snapshot público. |
| `/web/login` | Login anônimo | Snapshot público; formulário não apareceu no snapshot acessível. |
| `/404` | Página não encontrada | Snapshot público. |

### Mapeada no código, mas não confirmada em sessão

- Página de curso com progresso, módulos, preview, concluído e bloqueado.
- Página de aula com player, navegação, sidebar, quiz, recursos, discussão, transcrição, notas e fullscreen.
- Perfil público e perfil de eLearning.
- Dashboard `/my/home`, cursos, progresso, salvos, detalhes, segurança e endereços do portal.
- Registo, recuperação de palavra-passe, mensagens, uploads e acesso negado.
- Banner de cookies após consentimento e estados 403/500.
- Homepage sem cursos publicados, loading e falhas de imagem.

## Problemas críticos

### AUD-001 — staging não propagou a correção da homepage

**Estado:** `blocked` — commit `6db6eff` publicado, mas a propagação/atualização do módulo no staging ainda não foi observada. Em cache-busting após `244af44`, a homepage manteve `Seu proximo capitulo comeca em rede.`; o CSS novo de cards, incluindo `padding: 18px`, já aparece servido.

- **Página/componente:** `/`, homepage completa.
- **Descrição:** O staging ainda apresenta copy sem acentos e o comportamento anterior, incluindo `Seu proximo capitulo comeca em rede`, `Visao geral`, `Explore os cursos disponiveis` e `Tres passos para comecar a aprender`.
- **Evidência:** snapshot público de 2026-08-04; o branch contém `7019759`, mas a página não reflete o conteúdo corrigido.
- **Causa provável:** pipeline externo de Odoo não exposto no GitHub Actions ou cache/atualização de módulo ainda pendente.
- **Ficheiros relacionados:** `views/homepage.xml`, `static/src/scss/facodi_frontend.scss`, operação de deployment do staging.
- **Severidade:** P1. **Impacto:** invalida a aprovação visual pós-deployment. **Esforço:** S. **Risco:** médio. **Dependências:** acesso ao deployment/staging.
- **Correção recomendada:** confirmar o commit servido, atualizar o módulo/ativos no ambiente de teste e repetir as medições antes do merge.
- **Critério de aceitação:** DOM, CSS e copy públicos correspondem a `7019759` e screenshots dos cinco viewports são anexadas à evidência.

### AUD-002 — login público aparenta renderização incompleta

**Estado:** `verified` funcionalmente no staging — o DOM público contém formulário, email, password, submit e reset; a confirmação visual das classes FACODI aguarda a propagação do branch. A forma servida continua `oe_login_form`, sem `facodi-auth-form`.

- **Página/componente:** `/web/login`, formulário de autenticação.
- **Descrição:** O snapshot inicial não mostrava o conteúdo por não aguardar a renderização completa. A inspeção DOM posterior confirmou os campos, labels, botão, reset e passkey.
- **Evidência:** inspeção Playwright de `/web/login` em 2026-08-04; formulário `oe_login_form` com campos `login`/`password`, submit e `/web/reset_password`.
- **Causa provável:** XPath da herança de `web.login` não aplicado, template copiado pelo Website Builder divergente, ou bundle/estado de formulário sem markup.
- **Ficheiros relacionados:** `views/auth.xml`, `static/src/scss/facodi_frontend.scss`, templates Odoo `web.login`.
- **Severidade:** P1. **Impacto:** styling incompleto ainda pode degradar a experiência, mas a autenticação anônima não está bloqueada. **Esforço:** M. **Risco:** alto. **Dependências:** teste anônimo de login e reset após deploy.
- **Correção recomendada:** verificar HTML servido, heranças efetivamente aplicadas e console errors antes de alterar o template.
- **Critério de aceitação:** campos acessíveis de email/password, submit, registo e recuperação aparecem em todos os viewports e não há erro de asset.

### AUD-003 — estados de erro públicos permanecem standard Odoo em inglês

**Estado:** `fixed` localmente em `6db6eff`; `verified` no staging pendente da propagação. A rota `/404?audit=244af44` ainda não apresenta `#wrap.facodi-app-shell`, portanto o upgrade do módulo não ocorreu.

- **Página/componente:** `/404`, 403, 500 e estado de pesquisa vazio.
- **Descrição:** `/404` apresenta `Error 404`, `We couldn't find the page you're looking for!` e texto de ajuda em inglês; a pesquisa vazia apresenta `Search Results` e `Your search ... did not match anything.`.
- **Evidência:** snapshots públicos de `/404` e `/website/search?search=zzzzzz`.
- **Causa provável:** heranças incompletas ou seletores frágeis em `search_error.xml`; busca depende das templates standard sem uma camada FACODI consistente.
- **Ficheiros relacionados:** `views/search_error.xml`, `views/search_results.xml`, `static/src/scss/facodi_frontend.scss`.
- **Severidade:** P1. **Impacto:** experiência pública incoerente e acessibilidade/tradução incompleta. **Esforço:** M. **Risco:** médio. **Dependências:** confirmar IDs e markup Odoo 19.
- **Correção recomendada:** aplicar classes e copy translatável por herança resiliente, sem substituir texto por XPath dependente de idioma.
- **Critério de aceitação:** 404, 403, 500 e zero resultados usam shell, tipografia, cores e idioma FACODI; links de recuperação funcionam.

### AUD-004 — ID QWeb duplicado no portal

**Estado:** `fixed` localmente em `6db6eff`; upgrade/install no staging pendente.

- **Página/componente:** portal layout.
- **Descrição:** `facodi_portal_layout` aparece duas vezes em `views/profile.xml` com alvos de herança diferentes.
- **Evidência:** análise estática de `views/profile.xml`.
- **Causa provável:** cópia/edição incremental sem IDs distintos.
- **Ficheiro relacionado:** `views/profile.xml`.
- **Severidade:** P1. **Impacto:** uma herança pode substituir ou mascarar a outra. **Esforço:** XS. **Risco:** alto em instalação/upgrade. **Dependências:** inspeção do XML carregado.
- **Correção recomendada:** separar IDs e validar instalação/upgrade em banco descartável.
- **Critério de aceitação:** cada `ir.ui.view` tem XML ID único e todas as heranças carregam sem warning ou `ValidationError`.

### AUD-005 — heranças frágeis em superfícies nativas

**Estado:** `fixed` localmente em `6db6eff`; carregamento real em português/inglês pendente de upgrade no staging.

- **Página/componente:** erros, curso, header, footer e homepage.
- **Descrição:** Há XPath dependente de texto (`Oops`/`Forbidden`), predicado de igualdade exata de classe e substituições integrais de nós centrais.
- **Evidência:** análise de `search_error.xml`, `slides_course.xml`, `header.xml`, `footer.xml` e `homepage.xml`.
- **Causa provável:** heranças construídas sobre markup/idioma de uma versão específica do Odoo.
- **Severidade:** P1. **Impacto:** regressões silenciosas após atualização, idioma ou Website Builder COW. **Esforço:** M. **Risco:** alto. **Dependências:** templates Odoo 19 e testes de instalação.
- **Correção recomendada:** usar `hasclass()` e âncoras semânticas estáveis; limitar replacements integrais ao que é indispensável.
- **Critério de aceitação:** heranças carregam em idioma português e inglês, com alteração mínima dos templates base e testes de upgrade verdes.

## Problemas por página

### Homepage

- **AUD-006 — copy antiga ainda servida:** P1, confirmado no staging; dependente de AUD-001.
- **AUD-007 — navegação híbrida:** P2; `Courses`/`Contact us` no header convivem com links em português.
- **AUD-008 — fallback de curso sem token explícito:** P2, `fixed` localmente; `facodi-course-cyan` usa agora `--facodi-primary` e `--facodi-black`, com regra dedicada para o cartão e a sua arte. Validação estrutural passou; staging pendente de propagação.
- **AUD-009 — progresso via inline style:** P2; largura dinâmica não tem contrato documentado de intervalo nem variante de estado.
- **AUD-010 — estados sem dados não confirmados:** P2; fallback sem cursos, imagem ausente e progresso zero dependem de fixtures.

### Catálogo `/slides`

- **AUD-011 — título, busca e filtros standard em inglês:** P2; snapshot mostra `Courses`, `All Courses`, `Search courses`, `New Content` e `steps`.
- **AUD-012 — classes específicas e estilos genéricos:** P2, `fixed` localmente; resultados de pesquisa usam agora `facodi-search-result-card`, a classe adicionada pela herança QWeb, em vez do seletor global `.o_search_result_item`. XML e escopo SCSS validados; staging pendente de propagação.
- **AUD-013 — filtros, paginação e zero resultados sem evidência responsiva:** P2; estados precisam de screenshots e métricas nos cinco breakpoints.
- **AUD-014 — badges e metadados dependem do comprimento real:** P3; títulos, duração e número de passos precisam de teste com conteúdo longo.

### Páginas institucionais

- **AUD-015 — acentuação inconsistente:** P2; páginas públicas exibem `Educacao`, `acessiveis`, `curriculos`, `publico`, `visiveis`, `confianca` e similares.
- **AUD-016 — claims institucionais sem gate editorial:** P1; referências a SEA-EU, UAlg, financiamento e liderança associada exigem validação antes de publicação oficial.
- **AUD-017 — composição de conteúdo longo não validada:** P3; cards, listas e headings precisam de teste em tablet/mobile.

### Curso e aula

- **AUD-018 — grande parte da superfície não tem classe FACODI dedicada:** P2; classes XML como `facodi-course-main`, `facodi-course-nav`, `facodi-course-sidebar`, `facodi-slide-list`, `facodi-slide-cards`, `facodi-lesson-content` e `facodi-lesson-sidebar` não possuem seletor dedicado identificável.
- **AUD-019 — estados de progresso/join/preview/bloqueado não confirmados:** P1; risco funcional alto por depender de `website_slides`.
- **AUD-020 — lesson sidebar, quiz, comentários, tabs e fullscreen sem evidência browser:** P2; somente templates foram mapeados.
- **AUD-021 — compatibilidade com markup Odoo 19:** P2; heranças amplas precisam de instalação e curso real.

### Perfil, portal e autenticação

- **AUD-022 — portal parcialmente standard:** P2; SCSS concentra-se em `.o_portal` e estrutura Odoo, aumentando acoplamento.
- **AUD-023 — dashboard, tabelas, uploads e estados vazios não auditados em sessão:** P1; páginas protegidas inacessíveis sem conta de teste.
- **AUD-024 — login/signup/reset precisam de matriz própria:** P1; além do login, registo e recuperação não foram confirmados.
- **AUD-025 — perfil público e acesso negado não confirmados:** P2; templates existem, mas não há evidência renderizada.

### Shell, cookies e Website Builder

- **AUD-026 — footer com idioma e copy incompletos:** P2; `Faculdade Comunitaria Digital`, `Educacao superior aberta e acessivel` e `Open source para aprender em publico` precisam de normalização editorial.
- **AUD-027 — ícones expostos como glifos em snapshots de acessibilidade:** P3; Font Awesome pode estar visualmente correto, mas labels/semântica precisam de teste.
- **AUD-028 — cookies e snippets não confirmados:** P2; banner, rejeição, consentimento e snippet `facodi_learning_hub` precisam de browser/editor validation.
- **AUD-029 — fallback de Website Builder e COW não confirmados:** P2; replacements integrais podem divergir por website.

## Problemas globais

- **AUD-030 — cobertura de tokens parcial:** P2; a paleta está centralizada, mas há regras baseadas em classes Odoo e componentes sem variante FACODI dedicada.
- **AUD-031 — drift XML/SCSS:** P1; análise estática encontrou cerca de 26 classes `facodi-*` do XML sem seletor dedicado e classes SCSS aparentemente sem uso, incluindo `facodi-contribution-grid` e `facodi-stat-row`.
- **AUD-032 — risco de regras globais:** P2; seletores `.o_portal`, `.o_wslides_body`, `.card-body`, `.card-title` e outros estruturais podem afetar páginas não pretendidas.
- **AUD-033 — ausência de catálogo i18n do tema:** P2; não foram encontrados ficheiros de tradução no `theme_facodi`.
- **AUD-034 — legado `theme_open2` instalável:** P1; contém menus, páginas, copy e traduções Open2; ativação real no banco ainda precisa ser confirmada.
- **AUD-035 — hooks Python aparentemente mortos:** P2; `custom_theme.py` e `ir_http.py` não são importados por `models/__init__.py`, embora contenham lógica sobreposta.
- **AUD-036 — asset/editor dependency coupling:** P2; bundle de editor e ordem de primary variables/Bootstrap/frontend precisam de validação no bundle real, não apenas no SCSS isolado.

## Problemas de responsividade

A matriz solicitada é 390x844, 768x1024, 1024x768, 1440x1000 e 1920x1080. A primeira homepage audit já confirmou overflow de sidebar mobile antes da correção; a versão servida no staging ainda não permite verificar a correção.

Prioridades de medição:

- `document.body.scrollWidth` versus `clientWidth` em todas as rotas.
- bounds de header, conteúdo principal, cards, sidebars, footer e banners.
- grid columns e alturas mínimas/máximas dos cards.
- wrapping de títulos longos, badges, metadados e CTAs.
- sticky sidebar, navbar colapsada e footer sem sobreposição.
- ausência de imagens, zero resultados e mensagens de erro.
- hover/focus/active/disabled no desktop e foco por teclado no mobile.

Não há evidência suficiente nesta etapa para declarar aprovação dos cinco breakpoints para catálogo, curso, aula, portal ou autenticação.

## Problemas de acessibilidade

- **AUD-037 — labels e aria em inglês residual:** P2; header e homepage contêm labels técnicos em inglês.
- **AUD-038 — ícones Font Awesome como glifo:** P3; validar nome acessível, `aria-hidden`, foco e tooltip.
- **AUD-039 — estados de erro/pesquisa sem idioma FACODI:** P2; conteúdo standard dificulta compreensão e consistência.
- **AUD-040 — focus states fora da homepage sem evidência:** P2; confirmar links, botões, filtros, tabs, dropdowns, quiz e modal.
- **AUD-041 — contraste e reduced-motion:** P3; tokens e media query existem, mas não foram medidos em todas as famílias de componentes.

## Problemas de conteúdo e tradução

- Português sem acentos em homepage, footer e páginas institucionais.
- Mistura de PT-BR (`Contato`, `Acesse`) e PT-PT (`Registo`, `Contributo`), sem decisão editorial documentada para a interface pública.
- Inglês residual em header, catálogo, busca, erros, builder labels e acessibilidade.
- `Alianzas` aparece como forma suspeita em conteúdo português e precisa de revisão.
- Claims sobre SEA-EU/UAlg e reconhecimento institucional precisam de aprovação editorial; não devem ser ajustados apenas por estilo.
- `theme_open2` contém copy e menus legados que podem reaparecer se o módulo estiver ativo ou parcialmente instalado.
- Não há i18n catalogado no `theme_facodi`; strings estáticas devem ser extraídas antes de uma fase de correção.
- CTAs principais observados apontam para rotas existentes (`/slides`, `/sobre`, `/manifesto`, `/comunidade`, `/contactus`), mas cada destino deve ser smoke-tested após a propagação do tema.

## Problemas técnicos

| ID | Área | Causa provável | Ação futura |
| --- | --- | --- | --- |
| AUD-042 | XML/QWeb | IDs duplicados e replacements integrais | Normalizar IDs e reduzir o raio dos XPath. |
| AUD-043 | XML/QWeb | XPath dependente de texto/idioma | Migrar para `hasclass()` e âncoras estáveis. |
| AUD-044 | SCSS | Classes de markup sem regra e regras sem markup | Gerar matriz XML/SCSS automatizada e decidir cada divergência. |
| AUD-045 | SCSS | Seletores genéricos Odoo para componentes FACODI | Preferir variantes FACODI onde o componente tem contrato próprio. |
| AUD-046 | SCSS | Inline progress width | Definir contrato de range e limitar visualmente a largura. |
| AUD-047 | Python | Módulos não importados e lógica duplicada | Confirmar dead code em instalação real antes de remover. |
| AUD-048 | Assets | Dependência de bundle global do Odoo | Validar `web.assets_frontend`, editor e upgrade real. |
| AUD-049 | Dados | Cursos e estados dependem de dados reais | Criar fixtures descartáveis para estados sem destruir staging. |
| AUD-050 | Tradução | Ausência de i18n no tema | Escolher política linguística e gerar catálogo. |

## Componentes ainda standard Odoo

Confirmados ou fortemente indicados:

- Título e filtros do catálogo.
- Estado sem resultados da pesquisa.
- Página 404 e provavelmente 403/500.
- Elementos do login que não foram substituídos pelo snapshot.
- Componentes internos de `website_slides` sem classe FACODI dedicada.
- Estruturas de portal sob `.o_portal`.
- Chrome de cookies e alguns snippets do Website Builder.
- Rodapé de infraestrutura `Powered by Odoo` é standard e deve ser uma decisão de produto, não uma correção automática.

## CSS/JS/XML potencialmente obsoleto

- `models/custom_theme.py` e `models/ir_http.py`: não importados, com lógica sobreposta; confirmar antes de classificar como dead code definitivo.
- `facodi-contribution-grid` e `facodi-stat-row`: aparecem no SCSS sem uso XML identificado.
- Classes `facodi-*` usadas em views mas sem seletor dedicado: podem ser marcadores semânticos ou drift; cada caso precisa de decisão.
- `facodi-course-cyan`: usado no fallback sem regra explícita identificada.
- XPath textuais em `search_error.xml`.
- Predicados de classe exata em `slides_course.xml`.
- `theme_open2`: legado instalável; não remover nesta auditoria.
- `facodi_theme_editor.js`: builder label e integração devem ser testados no editor real.

## Riscos de regressão

1. Alterar header/footer/homepage por replacement pode quebrar Website Builder, COW views ou scripts de autohide; o header precisa manter `.top_menu`.
2. Alterar templates `website_slides` pode quebrar joins, progresso, quiz, navegação de aula e permissões.
3. Tornar copy translatável pode alterar extração, idioma default e páginas já copiadas pelo Website Builder.
4. CSS global sobre `.card`, `.o_portal` ou `.o_wslides_body` pode afetar apps Odoo não previstos.
5. Atualizar assets sem confirmar a ordem pode reintroduzir erro de bundle ou sobrescrita Bootstrap.
6. Limpar `theme_open2` sem confirmar ativação pode remover dependência de uma instalação existente.
7. Corrigir claims institucionais sem validação editorial pode criar afirmações incorretas.
8. Testes feitos apenas no staging neutralizado não provam comportamento do production database.

## Quick wins

1. Confirmar e documentar o commit realmente servido no staging.
2. Corrigir/validar o ID QWeb duplicado antes de qualquer trabalho de portal.
3. Inventariar e traduzir labels públicos em inglês e palavras sem acentuação.
4. Validar o markup do login e os links signup/reset.
5. Cobrir 404 e pesquisa vazia com copy e classes FACODI sem XPath textual.
6. Criar a matriz XML/SCSS para impedir novos casos de drift.
7. Smoke-testar todos os links do header/footer e registrar destinos quebrados.

## Melhorias estruturais

- Definir contrato de componentes FACODI para shell, cards, estados vazios, erros, formulários, progresso, badges e navegação.
- Preferir classes FACODI estáveis e seletores baseados em `hasclass()` em vez de depender da estrutura interna do Odoo.
- Separar tokens, shell, componentes, eLearning, portal, busca, erros e snippets no SCSS sem reformatar regras não relacionadas durante a correção.
- Adicionar catálogo de traduções e definir PT-BR ou PT-PT como política oficial.
- Criar fixtures de cursos e contas de teste para progresso, estados de aula e portal.
- Adicionar smoke tests browser por rota e viewport, incluindo zero resultados, 404, login e menu mobile.
- Confirmar se `theme_open2` é legado arquivável, dependência ativa ou módulo a desinstalar em procedimento separado.

## Plano de implementação

### Fase 1 — Regressões críticas

- **Inclui:** AUD-001 a AUD-005, login, erros, deployment, ID duplicado e XPath de maior risco.
- **Ficheiros prováveis:** `views/auth.xml`, `views/search_error.xml`, `views/profile.xml`, `views/header.xml`, `views/footer.xml`, `data/ir_asset.xml`.
- **Dependências:** deployment do staging, banco descartável e confirmação dos IDs Odoo 19.
- **Testes:** instalação/upgrade, XML, login anônimo, 404, busca vazia e console.
- **Risco:** alto.
- **Ordem:** primeira; bloquear merge de alterações visuais posteriores até fechar os P1.
- **Commits sugeridos:** `fix(auth): restore public authentication form`; `fix(theme): harden public error templates`; `fix(portal): normalize inherited view ids`.

### Fase 2 — Componentes globais

- **Inclui:** AUD-026, AUD-027, AUD-030, AUD-032, AUD-037 a AUD-041.
- **Ficheiros prováveis:** `header.xml`, `footer.xml`, `cookies.xml`, `search_results.xml`, `facodi_frontend.scss`, `bootstrap_overridden.scss`.
- **Dependências:** Fase 1 e decisão linguística.
- **Testes:** keyboard/focus, contraste, cookies, menu mobile, screenshots nos cinco viewports.
- **Risco:** médio/alto.
- **Commits sugeridos:** `fix(theme): align global public components`; `test(theme): cover public shell states`.

### Fase 3 — Homepage e catálogo

- **Inclui:** AUD-006 a AUD-014.
- **Ficheiros prováveis:** `homepage.xml`, `slides_catalog.xml`, `website_page.py`, `facodi_frontend.scss`.
- **Dependências:** AUD-001, cursos publicados e fixtures de vazio.
- **Testes:** cursos reais, sem cursos, busca, filtros, paginação, imagem ausente e cinco viewports.
- **Risco:** médio.
- **Commits sugeridos:** `fix(theme): complete homepage and catalog states`; `test(theme): add catalog responsive evidence`.

### Fase 4 — Curso e aula

- **Inclui:** AUD-018 a AUD-021.
- **Ficheiros prováveis:** `slides_course.xml`, `slides_lesson.xml`, `slides_profile.xml`, SCSS e templates base Odoo apenas para referência.
- **Dependências:** curso/aulas reais ou fixtures e Fases 1–3.
- **Testes:** join/continue, progresso, preview, bloqueio, concluído, quiz, comentários, recursos e fullscreen.
- **Risco:** alto.
- **Commits sugeridos:** `fix(slides): align course learning surfaces`; `fix(slides): align lesson navigation and states`.

### Fase 5 — Perfil, portal e autenticação

- **Inclui:** AUD-022 a AUD-025.
- **Ficheiros prováveis:** `profile.xml`, `auth.xml`, `slides_profile.xml`, SCSS.
- **Dependências:** AUD-004, contas de teste e regras de acesso.
- **Testes:** dashboard, detalhes, segurança, endereços, uploads, perfil, acesso negado, signup e reset.
- **Risco:** alto.
- **Commits sugeridos:** `fix(portal): align authenticated user surfaces`; `test(portal): cover authenticated states`.

### Fase 6 — Mobile e acessibilidade

- **Inclui:** todas as pendências de breakpoint, overflow, foco, contraste e movimento.
- **Ficheiros prováveis:** SCSS, templates globais e browser test harness.
- **Dependências:** Fases 1–5.
- **Testes:** 390x844, 768x1024, 1024x768, 1440x1000 e 1920x1080; teclado; reduced-motion; dark mode.
- **Risco:** médio.
- **Commits sugeridos:** `test(theme): add responsive audit matrix`; `fix(theme): close accessibility regressions`.

### Fase 7 — Limpeza técnica

- **Inclui:** AUD-031, AUD-034 a AUD-036, AUD-042 a AUD-050.
- **Ficheiros prováveis:** models, SCSS, manifest, legado `theme_open2` e documentação de operação.
- **Dependências:** confirmação de uso em banco e cobertura de testes.
- **Testes:** lint de XML/SCSS, instalação/upgrade, bundle, busca de classes, regressão browser.
- **Risco:** médio/alto; não misturar com correções visuais.
- **Commits sugeridos:** `refactor(theme): normalize frontend selector contracts`; `chore(theme): document legacy module boundaries`.

### Fase 8 — Testes e documentação

- **Inclui:** evidências finais, screenshots, checklist e atualização do audit baseline.
- **Ficheiros prováveis:** documentação do addon e testes browser/CI.
- **Dependências:** todas as fases anteriores.
- **Testes:** `python3 odoo-bin -u theme_facodi --stop-after-init`, `button_choose_theme()`, bundle sem erro CSS, Website Builder editável, smoke browser e `git diff --check`.
- **Risco:** baixo, mas gate obrigatório.
- **Commit sugerido:** `docs(theme): record frontend audit verification`.

## Estado da auditoria e páginas não auditadas

A superfície pública anônima principal foi acessada, mas não foi possível concluir a matriz visual completa dos cinco viewports nem validar superfícies protegidas sem sessão/fixtures. Permanecem não confirmados: dashboard/portal autenticado, curso/aula em todos os estados, perfil, signup/reset, cookies interativos, 403/500, loading, ausência total de cursos, fullscreen, quiz, transcrição e notas.

O ribbon de neutralização do banco é ambiente de teste. Não deve ser tratado como defeito do tema nem removido pelo addon.

## Critério de encerramento da próxima etapa

A auditoria será considerada operacionalmente fechada quando o staging servir a revisão atual, as áreas autenticadas forem testadas com contas/fixtures descartáveis, a matriz de cinco viewports tiver screenshots e métricas, os P1 tiverem critérios de aceitação verificados e a documentação registrar o resultado pós-implementação.
