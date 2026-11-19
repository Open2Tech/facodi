# Crédito público: Gustavo Scheidt (19/11/2026)

**Pedido:** o Marcelo pediu ao Gustavo que se acrescentasse à página Sobre.

O perfil `gustavo-scheidt` já existe na base, como rascunho pendente ("Planeamento de comunicação · a confirmar"). A publicação continua a passar pela função auditada `facodi.review_project_credit`, que regista quem aprovou e com que base de consentimento.

## Passo 1: aprovar em /editor/project-credits

| Campo | Valor |
|---|---|
| Papel | Estratégia, comunicação e crescimento |
| Título | Levar a FACODI a quem ainda não sabe que ela existe. |
| Descrição | O Gustavo cuida da estratégia, da aquisição e da comunicação da FACODI: redes sociais, parcerias e o caminho para a plataforma chegar a mais estudantes. |
| Fonte pública | https://www.linkedin.com/in/gustavoscheidt |
| Base de consentimento | `direct_written_confirmation` |
| Nota da revisão | Confirmação escrita do próprio Gustavo, no PR do GitHub aberto pela conta guguscheidt a pedido do Marcelo (19/11/2026). |

## Passo 2: nome, ligação e traduções

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72): https://github.com/guguscheidt/facodi/blob/scripts/facodi_credit_gustavo_scheidt_20261119/supabase/seeds/facodi_credit_gustavo_scheidt_20261119.sql

O script trata do que o formulário não cobre:

- muda o nome de "Gustavo Cezar Scheidt" para **Gustavo Scheidt**, como o próprio pediu;
- preenche `website_url`;
- acrescenta os textos em inglês, espanhol e francês.

Só altera o perfil se já estiver publicado, verificado e com consentimento. Antes do passo 1, não muda nada (devolve 0).

## Verificação

**PostgreSQL 17 local,** com as tuas migrações `…private_credit_queue` e `…credit_approval_with_explicit_consent`:

| Momento | Resultado |
|---|---|
| Script antes da aprovação | 0 |
| `review_project_credit` com os valores acima | aprova e regista `direct_written_confirmation` |
| Script depois da aprovação | 1 |
| Segunda execução | o mesmo estado |

**Navegador:** com o perfil injetado temporariamente (não está no PR), o cartão aparece em "Pessoas com crédito confirmado" na página /about, e "Ver fonte" aponta para o LinkedIn.

## Sofia

A Sofia ainda não está neste PR. Está na base como `sofia-pending` e falta confirmar o nome completo, o papel, a fonte pública e a autorização dela. Faço outro PR quando ela responder.
