# FACODI — proposta de crédito público de Gustavo Scheidt (PR #110)

**Origem:** [PR #110](https://github.com/Open2Tech/facodi/pull/110), aberta em 19/11/2026 pela conta `guguscheidt`. O autor declara aceitar o crédito público. Essa declaração é evidência apresentada para análise, **não é validação independente de identidade, papel ou consentimento**.

## Estado em produção — 20/11/2026

Projeto Supabase `wvkjainfwsyiyfcmbtid`, schema `facodi`, perfil `gustavo-scheidt`.

- **Preparado no rascunho:** nome público solicitado (Gustavo Scheidt), papel, título e descrição em PT, ligação ao LinkedIn em `website_url` e traduções EN/ES/FR.
- **Ainda privado:** `publication_state=draft`, `verification_state=pending`, `consent_for_public_credit=false` e `reviewed_at=NULL`.
- **Auditoria:** nenhuma linha de aprovação em `facodi.project_credit_approvals` para este perfil.
- A origem da proposta e a necessidade de revisão foram acrescentadas aos metadados privados, preservando os avisos anteriores sobre consentimento e função por confirmar.
- Não foram alterados o mecanismo de aprovação, as políticas RLS, o frontend ou outros perfis; nenhum email foi enviado.

## Aprovação editorial pendente

Aceder a [FACODI / Editor / Créditos](https://facodi.com/editor/project-credits) com uma conta `editor` ou `admin`. Selecionar Gustavo Scheidt; confirmar a correspondência da conta `guguscheidt` com o titular do crédito, a função proposta e a autorização para exposição pública. **Só após essa verificação** concluir o formulário, que chama `facodi.review_project_credit` e grava o editor real e a base de consentimento na tabela de auditoria.

| Campo do editor | Dados propostos, sujeitos à verificação |
| --- | --- |
| Papel | Estratégia, comunicação e growth |
| Título | Levar a FACODI a quem ainda não sabe que ela existe. |
| Descrição | O Gustavo cuida da estratégia, da aquisição e da comunicação da FACODI: redes sociais, parcerias e o caminho para a plataforma chegar a mais estudantes. |
| Fonte pública | https://www.linkedin.com/in/gustavoscheidt |
| Base de consentimento | `direct_written_confirmation`, **se** confirmada |
| Nota privada | Identificar a PR #110, o resultado e método da verificação de identidade e autorização, a função validada e a data. Não declarar verificações que não tenham ocorrido. |

O formulário atual pré-preenche o papel a partir do rascunho, mas exige introdução manual do título, da descrição, da fonte e da nota de revisão; os valores também estão no [manifesto JSON](../supabase/seeds/facodi_credit_gustavo_scheidt_20261119.json). A aprovação requer confirmação explícita no formulário.

**Não** aprovar por SQL administrativo, falsificar `auth.uid()`, nem atribuir `publication_state='published'` sem chamar a RPC autenticada. O script externo de «passo 2» citado na PR original deixou de ser necessário: a sua normalização de nome, ligação e traduções já está no rascunho, sem publicação.

## Validação depois da aprovação

1. Confirmar `published`, `verified_public`, consentimento `true` e `reviewed_by/reviewed_at` preenchidos em `facodi.project_profiles`.
2. Confirmar uma linha correspondente em `facodi.project_credit_approvals` com o editor e a justificação.
3. Abrir [Sobre](https://facodi.com/about): cartão em «Pessoas com crédito confirmado», link da fonte e texto nos quatro idiomas.
4. Confirmar que outros rascunhos, incluindo `sofia-pending`, continuam privados.

Os testes PostgreSQL 17 e de navegador descritos pelo autor da PR #110 foram locais, com dados temporários; não equivalem a validação E2E de uma aprovação real em produção.

## Limites

Esta alteração documenta apenas o pedido do Gustavo. Não transfere consentimento para Sofia nem qualquer outro colaborador, não adiciona migrations/SQL executável e mantém intacto o direito de retirada do crédito já implementado na FACODI.
