# FACODI

Um campus digital aberto: cursos, unidades curriculares e objetos educativos.
Frontend React + Vite, TypeScript, Tailwind/shadcn, TanStack Query e Supabase.
Usa Bun como único gestor de pacotes.

## Frontend em desenvolvimento — Cloudflare Workers (15/11/2026)

O endereço de **desenvolvimento e validação ativo** é
**https://facodi.marcelo-0d6.workers.dev/**, ligado à branch `facodi` do
repositório `Open2Tech/facodi`. As alterações no frontend devem ser
validadas primeiramente neste endereço; **não realizar deploys na Vercel
para cada alteração**, evitando os limites do plano atual.

O domínio canónico `https://facodi.com` (apex; `www.facodi.com` não tem DNS) continua separado do ambiente
de desenvolvimento. O Worker serve os assets estáticos de `dist/` através
de [`wrangler.jsonc`](wrangler.jsonc), com fallback para as rotas SPA e
cabeçalho `X-Robots-Tag: noindex` no preview. Requer apenas as variáveis
públicas de build `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`;
nunca incluir uma chave `service_role` no frontend.

Verificações recomendadas depois de um commit:
```sh
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:workers:smoke
```

O teste de Workers verifica disponibilidade, fallback SPA e cabeçalhos,
**mas não substitui um teste em navegador** que confirme os dados da API
e a navegação efetiva. No GitHub, o smoke aguarda o deploy do commit e confirma
a revisão servida antes de testar as rotas; o comando local verifica apenas o
build atualmente disponível. Ver [detalhes da verificação](docs/CODEBASE.md#verificação).
A documentação de configuração e o estado de builds
na Cloudflare devem ser consultados diretamente no painel de Workers & Pages;
este repositório não contém uma chave de gestão Cloudflare.

## Executar

```sh
export PATH="$HOME/.bun/bin:$PATH"
cp .env.example .env
# Preencher as duas variáveis em .env
bun install --frozen-lockfile
bun run dev
```

Variáveis públicas obrigatórias, sem valores alternativos:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Não utilizar service-role, chaves secretas ou tokens de gestão no frontend.
Não são necessários ID de projeto em ambiente, flags de funcionalidades, Odoo,
Edge Functions antigas ou um servidor de metadados. O Vite incorpora estas duas
variáveis no build; alterações exigem novo build.

| Operação | Comando |
|---|---|
| Desenvolvimento (porta 8080) | `bun run dev` |
| Testes | `bun run test` |
| Lint | `bun run lint` |
| TypeScript (app e Vite) | `bun run typecheck` |
| Build | `bun run build` |
| Preview Vite (porta 4173) | `bun run preview` |
| Navegador responsivo | `bun run test:e2e` |
| Tipos do schema remoto, só leitura | `bun run db:types` |

Para preparar os testes de navegador numa máquina sem Chromium:
`bunx playwright install chromium`.

O último comando escreve os tipos em stdout. Para os atualizar:

```sh
supabase --help
supabase gen types --help
bun run db:types > src/integrations/supabase/types.ts
```

Os tipos foram gerados do schema real, não de uma reprodução local.

## Identidade, comunidade e créditos editoriais

A FACODI assume a sua própria identidade: um campus digital aberto, nascido de uma experiência estudantil e apresentado no programa SEA-EU Student-Led Projects 2026. A comunicação usa uma voz mais humana, curiosa e criativa — inspirada na Monynha, sem confundir as duas iniciativas.

A página **/about** apresenta a história, o autor, os marcos e o ecossistema com fontes públicas. Em **/community**, estudantes e colaboradores encontram formas claras de participar. Em **/editor/project-credits**, apenas editores podem validar créditos pessoais com consentimento explícito e rasto de auditoria. As traduções PT/EN/ES/FR e os dados públicos vêm do schema FACODI no Supabase.

Foram criados oito perfis públicos e três marcos verificados; os três perfis de potenciais colaboradores permanecem privados até confirmação do papel e autorização. Não são usados dados de mensagens privadas para publicação automática.

[Auditoria de identidade, fontes, curadoria e política de consentimento](docs/facodi-project-identity-community-2026-11-14.md).

**Publicação confirmada:** o commit a71dc0d8b32cdce6f7e5390d54d628022ddb8142 ficou READY na Vercel, e a leitura pública confirmou `/about` e `/community` com os novos conteúdos. A fila `/editor/project-credits` permanece protegida e depende de teste real com conta editorial. Novos commits após essa versão exigem confirmar o respetivo deploy.

### Participação voluntária e proteção de créditos

A FACODI possui um novo fluxo **privado e sem envio de emails** para interessados em contribuir: `/community/join` (submissão autenticada, consentimento explícito, histórico próprio e eliminação da proposta) e `/editor/community` (revisão editorial, sem concessão automática de funções ou publicação de nomes). A base limita pedidos a três por utilizador em sete dias, protege os dados por RLS e não grava contactos pessoais adicionais.

Os créditos individuais só podem ser publicados ou retirados pelas funções auditadas `facodi.review_project_credit` e `facodi.revoke_project_credit`. As alterações diretas à tabela pública de perfis e aos registos privados de aprovação foram revogadas para os papéis da API.

O fluxo de participação inclui PT/EN/ES/FR, testes transacionais de segurança e verificações estáticas no build. **Não foram criadas inscrições falsas nem disparados emails**. A versão funcional no site depende da confirmação de um deploy Vercel `READY` contendo os commits mais recentes.

[Auditoria de colaboração, consentimento, RLS e zero-email](docs/facodi-community-participation-security-2026-11-15.md)

## Catálogo académico publicado (14/11/2026)

A FACODI reúne percursos de diferentes instituições (UAlg, UFES e Ifes). **Snapshot do catálogo público em 14/11/2026:** 6 cursos publicados, 256 unidades curriculares e 1.076 objetos educativos, incluindo 636 referências de vídeo e 145 leituras externas. Estes totais podem mudar com importações simultâneas; a distribuição por curso está disponível nas consultas Supabase.
- **[CTeSP em Sistemas e Tecnologias de Informação](https://facodi.com/courses/ctesp-sti):** 17 UCs, 120 ECTS, 4 semestres. Curso distinto do CTeSP Tecnologias Informáticas (1932), da variante Portimão (1970) e da Licenciatura LESTI. Foram associados 30 vídeos já existentes e 43 referências de leitura; criados 51 objetivos/competências de estudo editoriais; 17 percursos e 1 mapa curricular em rascunho interno. [Auditoria do CTeSP e plano oficial](docs/facodi-ctesp-sti-1812-ualg-2026-27.md).
- **LESTI + Design de Comunicação:** 84 UCs públicas, 568 ligações UC–vídeo e 113 associações de leitura, além de 252 objetivos editoriais e 86 percursos/mapas internos. Na licenciatura LESTI, sete grupos genéricos de opção têm apenas orientação curricular, não um programa disciplinar fictício.

- **[Licenciatura em Língua Inglesa e Literaturas de Língua Inglesa — UFES](https://facodi.com/courses/ufes-letras-ingles):** PPC oficial 2019, 75 componentes catalogados (28 obrigatórios, 2 estágios, 45 optativas alternativas), 3.210 horas de integralização, 225 objetivos editoriais, 36 leituras complementares e 152 associações a UCs, com 76 roteiros/mapas em rascunho interno. O currículo usa créditos brasileiros e não ECTS. **Enriquecimento de 15/11:** 87 vídeos educacionais externos verificados por origem (48 Crash Course, 23 British Council, 16 UNIVESP), 291 relações a 60 UCs e 8 coleções FACODI; arquivo do PPC 2006 com 67 componentes e 232 pares históricos de equivalência, sem reconhecimento automático de créditos. [Auditoria UFES 2019](docs/facodi-ufes-letras-ingles-ppc2019-integration.md) · [Vídeos e histórico 2006](docs/facodi-ufes-english-videos-history-2026-11-15.md) · [Qualidade curricular e 15 guias de estudo](docs/facodi-ufes-quality-and-study-guides-2026-11-15.md).
- **[Curadoria YouTube de oito canais](docs/facodi-eight-channel-youtube-curation-2026-11-15.md):** 63 vídeos distintos identificados (59 novos e 4 reutilizados), 152 associações curriculares propostas (149 novas), oito coleções editoriais e quatro playlists externas com fonte e título verificados. Sem cópia de vídeos, vínculo institucional presumido ou importação automática de membros das playlists.

**Incremento auditado em 15/11/2026:** 893 vídeos públicos e 102 sequências editoriais distintas publicamente navegáveis; quatro sequências novas organizam **56 aulas SQL Server já disponíveis**, uma nova coleção agrupa seis percursos de Bases de Dados e uma aula de Vetores do Professor Douglas Maioli foi verificada na fonte original e publicada. As coleções com filhos do tipo `playlist` passaram a listar esses percursos com ligação para `/sequences/:slug`. Nove vídeos, três transcrições e cinco UCs legadas continuam privados à espera de validação. [Relatório de auditoria e publicação](docs/facodi-catalog-audit-publication-2026-11-15.md).

**Notas de interpretação:** as optativas são alternativas de escolha, os 120 ECTS do CTeSP e os 180 ECTS das licenciaturas UAlg pertencem a planos diferentes, e os projetos editoriais FACODI não são fichas homologadas pelas instituições.

Os vídeos estão alojados no YouTube e os livros/documentações são **links para sítios externos**. A pertinência foi selecionada por títulos e temas; nem todos os vídeos foram revistos integralmente ou têm licenças verificadas. A pesquisa textual pública `facodi.search_public_resources_v3` está integrada em `/resources?search=...`: ignora acentos, cobre todos os tipos publicados, aceita variantes regionais de idioma e devolve contagens exatas por tipo, sempre sob RLS.

- [Ativação da pesquisa, moderação editorial e submissão de playlists](docs/facodi-activation-review-search-playlists-2026-11-14.md)
- [Auditoria do CTeSP UAlg 1812, fontes e resultados de segurança](docs/facodi-ctesp-sti-1812-ualg-2026-27.md)
- [Auditoria da cobertura das licenciaturas e pesquisa Supabase](docs/facodi-supabase-curriculum-coverage-and-search-2026-11-14.md)
- [Histórico da curadoria e origem dos materiais](docs/facodi-enrichment-and-email-review-2026-11-14.md)
- [Templates FACODI e integração segura do Supabase Auth](docs/facodi-auth-email-templates.md)
- [Auditoria funcional de entrega de emails e notificações de playlists](docs/facodi-email-delivery-verification-2026-11-14.md)

Os seis emails de autenticação FACODI (confirmação, convite, recuperação, magic link, alteração de email e reautenticação) estão **ativos globalmente** no Supabase Auth desde 15/11/2026; o Auth continua partilhado com o Tube O2. As sete notificações de segurança permanecem apenas versionadas. As notificações de submissão/aprovação/rejeição de playlists usam agora a fila privada `facodi.email_outbox` e a Edge Function `facodi-email-notifications`; o envio externo depende de `FACODI_RESEND_API_KEY` e `FACODI_EMAIL_FROM` com domínio verificado. Não foi comprovada entrega numa caixa de email. `facodi.playlists` continua sem submissões reais.

## Módulos e grafo de aprendizagem (15/11/2026)

**25 módulos novos de estudo** reutilizam 46 sequências de vídeo e 30 leituras/documentos já publicados, com 33 associações às UCs de cinco cursos, 13 relações de progressão conceptual e 9 ligações entre áreas relacionadas. Há **67 módulos públicos** no total. Nas páginas dos módulos, as sequências, leituras, fundamentos prévios e áreas relacionadas aparecem com acesso público controlado por RLS. A publicação foi validada no **Cloudflare (facodi.com)**, sem deploy na Vercel.

Exemplos: [Física — vetores e movimento](https://facodi.com/resources/facodi-modulo-20261115-physics-motion) · [Álgebra Linear — espaços e transformações](https://facodi.com/resources/facodi-modulo-20261115-algebra-vectors).

Os links são **recomendações editoriais**, não equivalências, acreditação ou pré-requisitos académicos oficiais. Nenhum vídeo foi copiado nem foram gerados exercícios. Detalhes, testes e proveniência na [auditoria do grafo de módulos](docs/facodi-study-modules-graph-2026-11-15.md).

## Percursos Odoo, redes e filtros por tema (15/11/2026)

A FACODI publicou **40 vídeos selecionados** a partir de `public.videos` (31 do canal oficial Odoo e 9 de fontes técnicas), organizando **20 novas sequências**, **10 módulos de estudo** e uma coleção Odoo. Estão agora públicos **933 vídeos**, **122 sequências editoriais** e **77 módulos**. Os conteúdos Odoo são **percursos FACODI independentes**, inspirados na organização por aplicações do [Odoo Learn](https://www.odoo.com/pt_BR/slides), sem acreditação ou certificação Odoo e sem duplicação dos ficheiros originais.

As tags de 81 vídeos e cinco sequências antigas de RH foram enriquecidas, e `/resources` passou a consultar contagens dinâmicas de temas via RPC `SECURITY INVOKER`, traduzidas PT/EN/ES/FR. [Coleção de percursos Odoo](https://facodi.com/resources/facodi-odoo19-percursos-gestao) · [Recrutamento](https://facodi.com/sequences/facodi-odoo19-rh-recrutamento) · [Redes e protocolos](https://facodi.com/sequences/facodi-tecnologia-redes-protocolos). Os novos módulos estão associados às UCs relevantes, incluindo Gestão, Gestão de Pessoas, Redes, Desenvolvimento Colaborativo e Low-Code.

A consulta anónima e o Cloudflare confirmaram a publicação das sequências e dos filtros. A apresentação dos **sete módulos dentro da coleção** foi também confirmada no Cloudflare numa segunda passagem, com links funcionais para os módulos e sequências. O módulo de RH exibiu três percursos e a referência Odoo Learn correspondente. Detalhes e limitações na [auditoria de publicação](docs/facodi-odoo19-learning-publication-2026-11-15.md). Vercel não foi utilizada.

## Editor seguro de ordem das videoaulas (15/11/2026)

O painel editorial inclui a [reordenação de sequências](https://facodi.com/editor/sequence-order): drag-and-drop, botões acessíveis para teclado e mobile, pré-visualização e confirmação. Uma RPC `SECURITY INVOKER` do Supabase limita alterações a editores, valida uma permutação integral de 2–200 vídeos e usa versão otimista com bloqueio transacional; as relações curriculares, vídeos e o progresso dos alunos não são alterados.

A UI foi validada em **facodi.com (Cloudflare)** com uma conta de editor de teste: entrada, movimentação e descarte funcionaram sem modificar aulas publicadas. O teste de backend, incluindo conflito de revisão e permutação inválida, foi executado com `ROLLBACK`. Os testes Vitest foram adicionados ao código, mas não executados nesta sessão. Consultar a [auditoria da funcionalidade](docs/facodi-editorial-sequence-order-2026-11-15.md).

## Ordenação de vídeos e consolidação segura (15/11/2026)

A auditoria dos objetos educativos normalizou as posições das aulas nas sequências, preservando a progressão dos estudantes. Uma sequência idêntica de Ondas e Luz foi consolidada entre Física e Astronomia, com **URL antigo a redirecionar para o recurso canónico**, sem perda de associações curriculares ou materiais. São agora **102 sequências editoriais distintas** (107 objetos `playlist` físicos, incluindo referências externas e um alias histórico). Foram ainda corrigidos **9 módulos do Ifes**, harmonizadas **11 ligações de vídeo** antes invisíveis na leitura pública e reorganizadas pedagogicamente **35 associações de vídeo** em Git, Python, SQL e Física.

A validação real em [facodi.com](https://facodi.com) confirmou as sequências de Álgebra Linear, Git, Python, SQL e o redirecionamento da Astronomia. Foram preservados **15 registos de progresso**; não houve duplicações nem perda de vídeos. Não foi utilizado Vercel. Consultar a [auditoria editorial e técnica](docs/facodi-learning-object-order-merge-audit-2026-11-15.md) e o [teste SQL de regressão, em modo read-only](scripts/audits/facodi_catalog_integrity.sql).

## Dados e permissões

O cliente único usa `db.schema = 'facodi'`. A aplicação consulta cursos,
UCs, recursos, relações curriculares e objetivos editoriais do schema FACODI.
As contas permanecem no schema gerido `auth`; não há tabelas de autenticação duplicadas.

- Cursos públicos: `published = true AND status = 'active'`.
- Unidades públicas: **`published = true AND status = 'active'`** tanto na UC
  como no curso. A policy RLS foi explicitamente restringida nesta revisão.
- Objetos educativos: `published = true AND status IN ('active', 'published')`.
- As relações `learning_object_relations` expõem apenas ligações publicadas
  aprovadas para leitura, e os objetivos editoriais apenas de UCs públicas.
- Migrações versionadas enriquecem o catálogo a partir de fontes reais. Percursos
  automáticos de apoio são rascunhos editoriais determinísticos, não resultados
  de modelos de IA; não existem alunos ou submissões fictícias.
- O editor associa unidades a cursos através de `course_id` e associa objetos
  existentes através de `learning_object_id`. As associações respeitam as
  constraints remotas e não criam objetos automaticamente.
- Publicar ativa o conteúdo e marca `published=true`; arquivar usa
  `status='archived', published=false`; voltar a rascunho retira o estado ativo.
- Não existe eliminação definitiva.

A navegação usa exclusivamente `user.app_metadata.role`: `editor` e `admin`.
Qualquer outro valor corresponde a utilizador comum. `user_metadata` só guarda
dados de apresentação, nunca autorização. A aplicação não promove contas.
Os papéis só ficam atualizados na sessão após renovação do JWT.
**RLS é o controlo efetivo dos dados; guardas React não substituem RLS.**

## Rotas

| Rota | Acesso |
|---|---|
| `/`, `/courses`, `/courses/:slug`, `/courses/:slug/units/:unit`, `/units`, `/resources`, `/resources/:slug`, `/sequences`, `/sequences/:slug`, `/about` | Público |
| `/login`, `/auth/callback`, `/auth/reset-password` | Público |
| `/notes` | Público (caderno do navegador para visitantes, da conta após login; `noindex`) |
| `/dashboard`, `/profile`, `/suggest` | Autenticado |
| `/editor`, `/editor/suggestions` | Editor ou admin |
| `/admin` | Admin |

`/auth` redireciona para `/login`; `/facodi` para `/courses`. Rotas sociais
antigas apresentam conteúdo não encontrado, sem resolução de nomes públicos.
O destino após login é validado contra uma lista de rotas internas
(incluindo páginas de detalhe `/resources/:slug` e `/sequences/:slug`).
As rotas privadas aguardam a hidratação. Logout, troca de identidade e
alteração de papel cancelam consultas e limpam caches de queries/mutações.
As respostas Supabase não são guardadas pelo service worker.

### Catálogos públicos e contribuições

`/units` lista unidades ativas cujo curso está publicado e ativo (join
`courses!inner`), e `/resources` lista objetos educativos publicados com
filtros por título, idioma e tema (`tags`). As contagens da página inicial usam
pedidos `HEAD` com `count=exact` sobre as mesmas regras; a RPC adicional
`search_public_catalog_v1` está disponível no backend, ainda sem ligação
à pesquisa do frontend.

`/units` aceita estado na URL: `search` (título ou código), `course` (slug do
curso), `year`, `semester` (semestre curricular, 1–6) e `sort`
(`curriculum`, `title`, `ects`), além de `page`. As facetas são contadas sobre
as unidades visíveis. Os slugs de unidades só são únicos dentro do curso, por
isso a página da UC vive em `/courses/:slug/units/:unit`. `/courses/:slug`
apresenta o plano de estudos por ano e semestre; as somas de ECTS não são
mostradas porque o plano inclui alternativas opcionais.

As migrações em `supabase/migrations/` publicam o catálogo UAlg e as
associações curriculares de vídeos efetivamente selecionados por título e canal.
As ligações já aceites são públicas; as ligações antigas com estado de revisão
pendente ou associações incorretas permanecem ocultas. Ver o relatório de
cobertura e respetivas condições de proveniência.

Contribuições de playlists YouTube estão disponíveis para **utilizadores
autenticados** em `/playlists/submit`, por meio da Edge Function
`facodi-submit-playlist` (JWT obrigatório, RLS, limites e revisão editorial).
Os vídeos só são publicados após aprovação de um editor em
`/editor/playlists`, criando relações com a UC numa transação. Outras
pipelines automáticas continuam sem acesso público direto. A fila de revisão
dos 104 percursos/mapas editoriais do catálogo atualizado fica em
`/editor/study-paths`, sem publicação automática ao aceitar um rascunho.

Utilizadores autenticados podem **sugerir um recurso** em `/suggest`. O
navegador lê metadados públicos (oEmbed do YouTube, APIs do GitHub e do Zenodo,
sem credenciais) e propõe a unidade curricular; o resto é manual. Na base, o
trigger de `facodi.resource_suggestions` normaliza o URL, deteta duplicados,
classifica a licença e grava uma recomendação (`fast_track`, `review`,
`reject`) que apenas ordena a fila. Em `/editor/suggestions`, a RPC
`review_resource_suggestion` aprova (cria um objeto em rascunho ou reutiliza o
existente e liga-o à unidade) ou recusa. Nada é publicado automaticamente.

### Sequências de estudo

`/sequences` lista as playlists editoriais da FACODI (RPC
`list_public_editorial_sequences_v1`, uma linha por sequência, com as UCs
associadas e a capa da primeira aula) e a página da UC mostra as que lhe estão
ligadas. `/sequences/:slug` usa `get_public_editorial_playlist_v2`; `?v=`
escolhe a aula. Com sessão iniciada, o progresso é autodeclarado e privado
(`facodi.editorial_playlist_progress`, RLS só do dono): marcar aulas
concluídas, retomar a posição guardada no vídeo e recomeçar a sequência. O
dashboard resume as sequências em curso.

## Auth: pré-requisitos antes de disponibilizar cadastro

Não publicar o cadastro sem verificar estes pontos no projeto de destino:

1. `facodi` exposto na Data API e grants/RLS apropriados para `anon` e
   `authenticated`, incluindo SELECT para UPDATE. Não conceder permissões
   globais nem desativar RLS para resolver erros.
2. Autorizar **os caminhos de callback da origem real da aplicação** em Auth
   Redirect URLs: `<origem>/auth/callback` e `<origem>/auth/reset-password`.
   Incluir os parâmetros `next` utilizados pelo callback de confirmação/email
   segundo as regras de correspondência do Supabase. Exemplos de desenvolvimento:
   `http://localhost:8080/auth/callback**` e
   `http://localhost:8080/auth/reset-password`.
   A origem de preview é normalmente `http://localhost:4173`, não HTTPS.
   O callback usa sempre a origem visitada; não fixar um domínio no código de Auth.
3. Confirmar que os templates de confirmação, recuperação e alteração de email
   seguem o `ConfirmationURL`/`RedirectTo` e não fixam rotas do frontend antigo.
4. Verificar triggers partilhados de `auth.users` com uma conta de teste:
   o cadastro nativo não deve exigir dados ou operações do frontend social.
   **Não alterar triggers partilhados para contornar incompatibilidades.**
5. Testar confirmação e recuperação com caixa de email de teste autorizada.
   O fluxo PKCE exige abrir o link no mesmo navegador que iniciou o pedido.
   Links inválidos, reutilizados, expirados ou sem código mostram erro e
   permitem pedir recuperação novamente.

O frontend usa sessões persistentes, renovação automática e PKCE; troca o código
no callback explicitamente uma única vez. Alterações de email podem exigir
confirmação nos dois endereços. Erros Auth/RLS são apresentados ao utilizador.

### Verificação remota desta refatoração

- CLI gerou os tipos do schema `facodi`.
- GETs reais com a chave pública nas três tabelas devolveram HTTP 200 e listas
  vazias. Isto comprova a acessibilidade pública dos endpoints, **não** as
  políticas de escrita nem a existência de conteúdo editorial.
- Auth público reportou email/cadastro habilitados e confirmação obrigatória.
- Os templates locais de confirmação, recuperação e alteração de email usam
  `ConfirmationURL`, mas mantêm identidade histórica partilhada. Não foram
  publicados nem alterados; a validação do email recebido continua necessária.
- `supabase config diff --project-ref wvkjainfwsyiyfcmbtid` foi executado só em
  leitura. Existem diferenças locais/remotas; **não executar config push**.
  As URLs existentes não comprovam que os novos caminhos de callback sejam
  aceites. A configuração remota foi preservada.
- A ligação SQL pela CLI falhou no pooler sem credencial Postgres utilizável.
  Não foi possível confirmar constraints CHECK, grants detalhados ou triggers.
  Os formulários validam os campos conhecidos e apresentam rejeições do schema;
  os valores aceites para `object_type` devem ser confirmados antes da entrega.
- Não foram disponibilizadas sessões reais de utilizador, editor e admin.
  Os testes automatizados verificam comportamento frontend/contratos HTTP,
  **não comprovam RLS**. Cadastro completo, emails, renovação, escrita/publicação
  e arquivamento reais permanecem bloqueadores de disponibilização.

Não criar um admin nem modificar contas existentes para testar. Utilizar contas
de teste aprovadas e sessões correspondentes. Não colocar credenciais em testes,
logs ou commits.

### Verificação local concluída

- 45 testes unitários/de contrato e 11 testes Chromium passaram.
- Lint, verificação TypeScript real da app/config e build de produção passaram.
- Home e catálogo verificados em 375, 768, 1280 e 1440 px, sem overflow horizontal.
- Axe não encontrou violações WCAG A/AA nos controlos verificados da página inicial.
- Fluxos de Auth, editor e admin no Chromium utilizam respostas de teste
  intercetadas; não enviam emails nem criam conteúdo no projeto remoto.

### Percurso histórico independente de Astronomia e Astrofísica (GACS/Ifes, 2018)

Foi publicado um **novo percurso editorial FACODI de 10 etapas** sobre astronomia e astrofísica, inspirado na memória de participação num curso introdutório associado às atividades do GACS (Ifes Cariacica, 2018). Integra 6 referências institucionais externas, 22 associações às fontes, 9 vídeos distintos reutilizados, 14 vínculos vídeo–etapa e 20 objetivos originais.

**Não se trata de uma reedição oficial do curso de extensão de 2018, nem da disciplina de 60 horas/4 créditos da Licenciatura em Física do Ifes, nem da edição de 2018 do INPE**. Os dez temas são reconstrução FACODI publicada em 2026, sem equivalência, certificado ou carga horária formal confirmada.

- [Abrir curso no Cloudflare Workers](https://facodi.marcelo-0d6.workers.dev/courses/astronomia-astrofisica-gacs-2018)
- [Auditoria técnica, fontes e limitações](docs/facodi-gacs-astronomia-astrofisica-2018.md)

## Deployment

```sh
bun run build
bun run preview
```

O resultado está em `dist/`. Configurar fallback SPA para `index.html`, mantendo
os caminhos `/auth/*`. Cloudflare usa [wrangler.jsonc](wrangler.jsonc).
Docker serve o build estático com nginx e aceita apenas as duas variáveis públicas
como build arguments. Não necessita de segredos no runtime.

Os metadados de página (título, descrição, canonical em `https://facodi.com`,
Open Graph, Twitter Card e JSON-LD) vêm de [`src/shared/seo/seo.ts`](src/shared/seo/seo.ts)
e são aplicados com `PageSeo`. O build gera snapshots HTML por página pública a
partir das linhas visíveis pela chave publicável e pelas políticas RLS do schema
`facodi`, além do sitemap completo. Não é SSR: a SPA continua a arrancar nos
snapshots; os metadados são atualizados a cada build/deploy. Com o placeholder
`.invalid` do CI, são geradas apenas as páginas estáticas e o sitemap básico;
variáveis ausentes ou URLs inválidos fazem o build falhar. Se a RPC pública de
sequências atingir o limite de 500 ou devolver uma resposta incompleta, o build
falha até existir uma forma de enumeração realmente paginável. Conteúdos privados
e inexistentes não entram no sitemap; o fallback SPA mantém o comportamento de
soft 404 (HTTP 200).
O manifesto, os ícones PNG e o favicon são FACODI.
O antigo servidor Bun de metadados foi removido; os documentos antigos de Odoo
são históricos e não fazem parte dos comandos nem da imagem de runtime FACODI.
Não executar scripts legados de enriquecimento contra este frontend.

Esta aplicação está publicada em **https://facodi.com**. O catálogo
académico e os recursos externos foram inseridos no Supabase através de
migrações versionadas (ver auditoria acima). A aplicação não cria automaticamente
inscrições, progresso académico, uploads, novas análises por IA ou perfis de
utilizador. Os conteúdos originais do Tube e as respetivas tabelas `public`
permanecem preservados.

## Domínio FACODI, templates de email e créditos
O domínio `facodi.com` (apex, Cloudflare) serve o mesmo build do Worker e é o URL canónico usado em metadados, `robots.txt` e `sitemap.xml`. `www.facodi.com` não tem registo DNS. **Atualizado em 15/11/2026:** os 13 templates FACODI versionados apontam para `https://facodi.com`; o catálogo de pré-visualização no Supabase foi atualizado diretamente. Os templates globais do Supabase Auth continuam partilhados com o Tube O2 e **foram atualizados para a identidade FACODI por decisão explícita do responsável**, pelo que também afetam emails de utilizadores Tube. Os fluxos de entrega continuam a carecer de verificação real. O código de autenticação usa `window.location.origin` para o callback, pelo que o domínio visitado é mantido.

**Atenção:** `supabase/config.toml` espelha o Auth alojado (`auth.site_url=https://facodi.com`, partilhado com o Tube O2) e aponta os seis templates de autenticação para `supabase/email-templates/facodi/`. Os 13 templates com identidade FACODI estão guardados em `facodi.email_template_catalog` como catálogo privado e também em `supabase/email-templates/facodi/`. **O catálogo em si não altera o Auth nem envia mensagens;** os templates globais são aplicados por `supabase config push` com revisão do diff. O editor pode rever os templates sem envio em `/editor/email-templates`.

Créditos individuais indicados pelo responsável do projeto: **Gustavo Cezar Scheidt, Bilal Uddin, Andreia Cirne, Sofia e Tércio**. As cinco candidaturas estão em `facodi.project_profiles` como `draft/pending`; a aplicação só apresenta nomes publicamente depois da aprovação editorial, com fonte pública e consentimento confirmado. `/editor/project-credits` é a fila para essa validação. Nome completo e função de Sofia e Tércio ainda não estão documentados. Não foram enviados emails.

## Arquitetura

Consultar [docs/CODEBASE.md](docs/CODEBASE.md). As traduções de português, inglês,
espanhol e francês estão alinhadas em [src/i18n/locales](src/i18n/locales).
