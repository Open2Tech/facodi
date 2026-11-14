# FACODI

Um campus digital aberto: cursos, unidades curriculares e objetos educativos.
Frontend React + Vite, TypeScript, Tailwind/shadcn, TanStack Query e Supabase.
Usa Bun como único gestor de pacotes.

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

## Catálogo académico publicado (14/11/2026)

A FACODI mantém **três cursos públicos da Universidade do Algarve**, incluindo o novo **CTeSP em Sistemas e Tecnologias de Informação (curso oficial 1812, Faro)**. São **101 UCs públicas** e **733 objetos educativos públicos**: **564 vídeos externos**, **65 referências de leitura/planeamento**, **101 UCs** e **3 cursos**.

- **[CTeSP em Sistemas e Tecnologias de Informação](https://facodi.vercel.app/courses/ctesp-sti):** 17 UCs, 120 ECTS, 4 semestres. Curso distinto do CTeSP Tecnologias Informáticas (1932), da variante Portimão (1970) e da Licenciatura LESTI. Foram associados 30 vídeos já existentes e 43 referências de leitura; criados 51 objetivos/competências de estudo editoriais; 17 percursos e 1 mapa curricular em rascunho interno. [Auditoria do CTeSP e plano oficial](docs/facodi-ctesp-sti-1812-ualg-2026-27.md).
- **LESTI + Design de Comunicação:** 84 UCs públicas, 568 ligações UC–vídeo e 113 associações de leitura, além de 252 objetivos editoriais e 86 percursos/mapas internos. Na licenciatura LESTI, sete grupos genéricos de opção têm apenas orientação curricular, não um programa disciplinar fictício.

**Totais atuais:** 303 objetivos editoriais de estudo e 303 competências propostas, com **104 percursos/mapas internos** ainda em `draft`. Os 120 ECTS do CTeSP e os 180 ECTS de cada licenciatura são planos distintos. Os ECTS das opções alternativas das licenciaturas não são somáveis indiscriminadamente.

Os vídeos estão alojados no YouTube e os livros/documentações são **links para sítios externos**. A pertinência foi selecionada por títulos e temas; nem todos os vídeos foram revistos integralmente ou têm licenças verificadas. A pesquisa textual pública `facodi.search_public_resources_v2` está integrada em `/resources?search=...`, com RLS, filtros e índice GIN.

- [Ativação da pesquisa, moderação editorial e submissão de playlists](docs/facodi-activation-review-search-playlists-2026-11-14.md)
- [Auditoria do CTeSP UAlg 1812, fontes e resultados de segurança](docs/facodi-ctesp-sti-1812-ualg-2026-27.md)
- [Auditoria da cobertura das licenciaturas e pesquisa Supabase](docs/facodi-supabase-curriculum-coverage-and-search-2026-11-14.md)
- [Histórico da curadoria e origem dos materiais](docs/facodi-enrichment-and-email-review-2026-11-14.md)
- [Templates FACODI e integração segura do Supabase Auth](docs/facodi-auth-email-templates.md)
- [Auditoria funcional de entrega de emails e notificações de playlists](docs/facodi-email-delivery-verification-2026-11-14.md)

Os 13 emails de autenticação FACODI estão preparados e testados estaticamente, mas **não ativados globalmente**: o Auth Supabase ainda é partilhado com o Tube O2. As notificações de submissão/aprovação/rejeição de playlists usam agora a fila privada `facodi.email_outbox` e a Edge Function `facodi-email-notifications`; o envio externo depende de `FACODI_RESEND_API_KEY` e `FACODI_EMAIL_FROM` com domínio verificado. Não foi comprovada entrega numa caixa de email. `facodi.playlists` continua sem submissões reais.

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
| `/`, `/courses`, `/courses/:slug`, `/courses/:slug/units/:unit`, `/units`, `/resources`, `/resources/:slug`, `/about` | Público |
| `/login`, `/auth/callback`, `/auth/reset-password` | Público |
| `/dashboard`, `/profile` | Autenticado |
| `/editor` | Editor ou admin |
| `/admin` | Admin |

`/auth` redireciona para `/login`; `/facodi` para `/courses`. Rotas sociais
antigas apresentam conteúdo não encontrado, sem resolução de nomes públicos.
O destino após login é validado contra uma lista de rotas internas.
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
   Não inferir um domínio de produção a partir de `facodi.com`.
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

## Deployment

```sh
bun run build
bun run preview
```

O resultado está em `dist/`. Configurar fallback SPA para `index.html`, mantendo
os caminhos `/auth/*`. Cloudflare usa [wrangler.jsonc](wrangler.jsonc).
Docker serve o build estático com nginx e aceita apenas as duas variáveis públicas
como build arguments. Não necessita de segredos no runtime.

Não há canonical/sitemap com domínio inventado. O manifesto e o favicon são
FACODI; antigos assets de imagem não são usados pela aplicação.
O antigo servidor Bun de metadados foi removido; os documentos antigos de Odoo
são históricos e não fazem parte dos comandos nem da imagem de runtime FACODI.
Não executar scripts legados de enriquecimento contra este frontend.

Esta aplicação está publicada em **https://facodi.vercel.app**. O catálogo
académico e os recursos externos foram inseridos no Supabase através de
migrações versionadas (ver auditoria acima). A aplicação não cria automaticamente
inscrições, progresso académico, uploads, novas análises por IA ou perfis de
utilizador. Os conteúdos originais do Tube e as respetivas tabelas `public`
permanecem preservados.

## Arquitetura

Consultar [docs/CODEBASE.md](docs/CODEBASE.md). As traduções de português, inglês,
espanhol e francês estão alinhadas em [src/i18n/locales](src/i18n/locales).
