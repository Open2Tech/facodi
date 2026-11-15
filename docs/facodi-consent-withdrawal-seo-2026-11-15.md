# FACODI — Retirada de créditos, SEO público e próximos passos

**Data:** 15/11/2026. **Ambiente:** Supabase `wvkjainfwsyiyfcmbtid`, schema `facodi`. **Repositório:** `Open2Tech/facodi`, branch `facodi`.

## Alterações efetuadas

### Consentimento e crédito individual revogável

**Migração aplicada no Supabase e versionada no repositório:**

`20261115070655_facodi_editor_audited_contributor_credit_withdrawal.sql`

- A tabela `facodi.project_credit_revocations` contém perfil, editor, data e motivo da retirada, com RLS habilitado. A auditoria é acessível apenas por editores; visitantes não têm permissões.
- A RPC `facodi.revoke_project_credit(profile_id, reason)` usa `SECURITY INVOKER` e exige `auth.uid()` autenticado, o papel `editor`/`admin` do `app_metadata`, uma justificativa de 25 a 600 caracteres e um crédito individual previamente aprovado.
- No mesmo commit SQL, retira a publicação pública (`archived`), desmarca consentimento, assinala verificação como disputada e guarda uma revogação. O perfil deixa de satisfazer a RLS pública.
- O editor dispõe de um formulário de retirada em `/editor/project-credits` que exige justificativa e confirmação explícita. Há traduções PT/EN/ES/FR.
- Não permite reativação automática: qualquer reatribuição posterior necessita de novo processo de verificação de consentimento.

**Testes SQL transacionais executados:**

1. Editor simulado aprova um crédito candidato e depois o retira na mesma transação.
2. Foi observado `publication_state=archived`, `verification_state=disputed` e `consent_for_public_credit=false`, com uma aprovação e uma revogação temporárias.
3. `ROLLBACK` preservou todos os registos reais.
4. `anon` não consegue executar a RPC nem consultar auditorias privadas.

**Estado real:** 8 perfis públicos, 3 candidatos privados, 0 aprovações pessoais efetivas e 0 retiradas efetivas. Nenhuma pessoa foi publicada ou removida nesta intervenção.

A autorização comunicada por mensagem e a comprovação da identidade e do papel devem ser verificadas por humanos antes de aprovar qualquer crédito. A plataforma não certifica automaticamente que um URL público ou uma declaração textual provam consentimento.

### Comunicação individual no Gmail

Foram preparados **dois rascunhos, sem envio**, para pedir consentimento e descrição de créditos a pessoas envolvidas em conversas de colaboração e comunicação do projeto. Os rascunhos não afirmam parceria já formalizada, entrega ou consentimento obtido. As ligações Gmail, endereços e conteúdos privados não foram introduzidos no repositório público.

Nenhuma campanha coletiva foi criada e nenhum contacto SEA-EU foi importado.

### Descoberta e SEO

- `src/components/project/ProjectPageSeo.tsx` cria títulos, descrições, canonical, Open Graph, Twitter summary e `WebPage/AboutPage` em JSON-LD para `/about` e `/community`.
- `public/sitemap.xml` contém apenas as sete rotas públicas essenciais: `/`, `/courses`, `/units`, `/resources`, `/sequences`, `/about`, `/community`.
- `public/robots.txt` passou a incluir a localização do sitemap e a orientar robôs para não rastrear rotas de autenticação e gestão.
- As quatro traduções têm título/descrição próprios. Não se anuncia `hreflang` para endereços que não existem.
- `scripts/validate-facodi-project-pages.mjs` verifica as rotas públicas, metadados, traduções e os controlos de retirada de crédito. Esta validação foi acrescentada ao `build`, incluindo as construções de CI.

**Limitação importante:** a aplicação é uma SPA React/Vite. Metadados gerados por React Helmet dependem da execução de JavaScript pelo rastreador; `sitemap.xml` e tags base ajudam, mas não substituem pré-renderização/SSR se for necessária indexação profunda dos percursos ou recursos dinâmicos.

## Qualidade e publicação

A execução GitHub Actions **[FACODI validation #159](https://github.com/Open2Tech/facodi/actions/runs/43689000803)** terminou com sucesso, incluindo ESLint, TypeScript, testes, templates de email e build Vite com a nova verificação estática.

A tentativa explícita de deployment do commit `d1b1680e618e6629192fdf4c150cb7633df695c5` foi recusada pela API Vercel com **402 / `api-deployments-free-per-day`**. Este limite depende do plano e de quota da equipa; não foi alterada faturação nem tentada mudança de subscrição. **Não anunciar o novo SEO como publicado até um deploy READY conter esses commits.**

As páginas originais de história e comunidade já estavam disponíveis publicamente antes desta intervenção; esta fase acrescentou melhorias ainda sujeitas à publicação de um build posterior.

## Próximos testes operacionais

1. Verificar o SHA `READY` da Vercel e abrir `/sitemap.xml`, `/robots.txt`, `/about` e `/community` num navegador.
2. No editor real, conferir a lista de créditos aprovados e testar retirada apenas quando existir um pedido legítimo — não simular em produção com uma pessoa real.
3. Rever em mobile a navegação da comunidade, cartões de organização e contrastes no modo escuro.
4. Rever documentos pessoais de autorização somente em local privado; não arquivar mensagens ou listas de contactos no repositório.
5. Se a indexação profunda de cursos for um objetivo, preparar uma estratégia de pré-renderização de rotas públicas e respeitar a distinção entre materiais oficiais e recursos editoriais da FACODI.
