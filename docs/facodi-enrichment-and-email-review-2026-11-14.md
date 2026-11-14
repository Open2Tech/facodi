# FACODI — enriquecimento académico e revisão dos emails

**Data:** 14 de novembro de 2026  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid`, schema `facodi`  
**Frontend:** https://facodi.vercel.app  
**Repositório:** https://github.com/Open2Tech/facodi (branch `facodi`)

## 1. Resultado na base de dados (validado)

| Indicador | Resultado |
|---|---:|
| Cursos públicos UAlg | 2 |
| UCs oficiais do plano 2026/27 publicadas | 84 |
| UCs com vídeos de apoio | 29 |
| Objetos educativos públicos | 650 |
| Vídeos YouTube distintos publicados | 564 |
| Associações UC–vídeo públicas aprovadas para ligação externa | 568 |
| Objetivos de estudo **editoriais**, não oficiais | 252 |
| Competências temáticas **propostas**, não acreditadas | 252 |
| Palavras-chave com origem identificada | 906 |
| Etiquetas | 95 |
| Associações a etiquetas | 2.158 |
| Referências externas | 659 |
| Submissões reais em `facodi.playlists` | 0 |

Estas contagens são diferentes do relatório histórico [facodi-publication-audit-2026-11-14.md](facodi-publication-audit-2026-11-14.md), que descreve o lote anterior de 519 vídeos, antes deste incremento.

### Origem e curadoria

- 84 UCs possuem `metadata.study_topics` com três assuntos de orientação; os 252 objetivos e as 252 competências resultam **exclusivamente desses assuntos já registados**. O texto é editorial FACODI e está marcado como `official_learning_outcome=false`, `teacher_validated=false` e `editorial_proposal=true`.
- Foram criados termos de pesquisa a partir dos tópicos das UCs e dos **títulos originais dos vídeos**, sem inventar conteúdos.
- As etiquetas por UC e curso foram ligadas a vídeos através de `unit_videos` já aprovados para exposição como links externos; `learning_objects.tags` inclui agora os nomes das UCs e dos cursos respetivos.
- Dos vídeos existentes no catálogo histórico `public.videos`, foram acrescentados **45 vídeos** com títulos concretos e associações explícitas. Alguns são **estudos de caso de fornecedores externos** (incluindo tutoriais de ERP e desenvolvimento); cada um contém `vendor_case_study=true`. Isto não constitui endosso da marca nem integração operacional da FACODI com o respetivo produto.
- A seleção de vídeos continua a ser por **títulos e canais**, não por visualização integral, transcrição ou validação de direitos. Os 564 objetos publicados mantêm `content_license_verified=false`. O media continua alojado nas fontes originais do YouTube.

### Áreas com cobertura melhorada

- Gestão (8 vídeos), Inteligência Artificial (1), Redes de Computadores (1), Perceção e Composição Visual (1), Técnicas da Imagem em Movimento (1), Computação Visual (1), Desenvolvimento de Aplicações com Low-Code (3).
- Computação em Nuvem (22), Desenvolvimento de Aplicações Web (16), Aprendizagem Automática (15) e Cibersegurança (4).

### Estado das restantes entidades

- Cinco UCs legadas não confirmadas no plano 2026/27 continuam privadas.
- Nove vídeos do lote inicial permaneceram fora da publicação por desadequação temática.
- Três documentos de transcrição não validados continuam privados.
- `facodi.playlists` não foi artificialmente preenchida com autores ou submissões fictícias.
- `facodi.youtube_channels` continua sem registos porque `public.videos` tem `channel_name`, mas **não** tem os IDs reais de canal do YouTube; não se geraram IDs fictícios.
- Não foram criados alunos, cursos de IA imaginários, resultados de análise por modelos, notas nem progressos simulados.

## 2. Autorização e integridade

Um teste PostgreSQL com `SET LOCAL ROLE anon` confirmou:
- 2 cursos, 84 UCs e 650 objetos educativos visíveis;
- 252 objetivos e 252 competências editoriais visíveis, vinculados a objetos publicados;
- 0 classificações privadas e 0 documentos privados visíveis.

As verificações de relações confirmaram **zero** competências em falta, zero objetivos associados a objetos ocultos e zero objetivos erroneamente marcados como oficiais.

## 3. Frontend

A página pública de uma UC apresenta um roteiro de estudo, os três objetivos editoriais e, quando aplicável, vídeos de apoio. As páginas de cursos e a biblioteca de recursos permanecem acessíveis sem autenticação.

Páginas de produção verificadas através de navegador com renderização JavaScript:

- https://facodi.vercel.app/courses/lesti/units/19411010 — Gestão, três objetivos editoriais e 8 vídeos;
- https://facodi.vercel.app/courses/lesti/units/19411022 — Inteligência Artificial, três objetivos e um vídeo;
- https://facodi.vercel.app/courses/ldcom/units/14541181 — Perceção e Composição Visual, três objetivos e um vídeo;
- https://facodi.vercel.app/resources — catálogo público com **650 recursos**.

Durante a implementação, uma alteração concorrente melhorou o componente de vídeo. Foi ajustada a ligação ao `useUnitOutcomes` sem remover essa melhoria. O deploy posterior da Vercel para a branch `facodi` atingiu `READY`.

## 4. Email e autenticação

Foram criados **13 templates FACODI** em `supabase/email-templates/facodi/`:

- 6 emails de autenticação: confirmação, convite, recuperação de palavra-passe, magic link, alteração de email e reautenticação;
- 7 notificações de segurança: alterações de palavra-passe/email/telefone, associação/remoção de métodos de acesso e MFA.

Layout em PT-PT, `<table role="presentation">`, CSS inline e identidade Ink/Cyan/Mint da FACODI; sem carregamento de imagens ou fontes externas. As mensagens usam placeholders GoTrue suportados: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .NewEmail }}`, `{{ .OldEmail }}`, `{{ .Email }}`, `{{ .OldPhone }}`, `{{ .Phone }}`, `{{ .Provider }}` e `{{ .FactorType }}`.

A aplicação assinala `client_app='facodi'` no `user_metadata` **apenas para o futuro roteamento visual de emails**. Esse valor é editável pelo utilizador e **não** serve como controlo de acessos.

O teste estático conferiu os 13 ficheiros (13/13). **Não foram enviados emails reais nem alterados os templates globais alojados do Supabase Auth.** O projeto Auth é partilhado com Tube O2; mudar o template do projeto sem um roteador de marca faria os utilizadores de Tube receberem emails FACODI. A equipa precisa configurar uma instância Auth dedicada ou um mecanismo condicional seguro, depois de confirmar SMTP e allow-list de redirecionamento. A allow-list foi atualizada apenas no ficheiro local `supabase/config.toml`, **sem `config push`**.

Instruções e detalhes: [facodi-auth-email-templates.md](facodi-auth-email-templates.md).

## 5. Migrações reproduzíveis

- `20261114162938_facodi_editorial_outcomes_competencies_and_video_tags.sql`
- `20261114164012_facodi_publish_45_targeted_videos_and_applied_case_studies.sql`

Cada migração foi validada por `BEGIN … ROLLBACK` antes da aplicação, depois executada no projeto e versionada no repositório. Novas entradas usam UUIDs determinísticos derivados das chaves do catálogo real. Nenhum registo do Tube foi removido ou alterado.

## 6. Próximas prioridades

1. Validar manualmente a pertinência dos links nas 29 UCs com vídeos e criar uma sequência didática real para cada uma.
2. Enriquecer as 55 UCs ainda sem aulas com recursos abertos licenciados e revisados.
3. Obter IDs de canal YouTube verificáveis e/ou metadados oficiais adicionais, evitando IDs sintéticos.
4. Validar as 13 mensagens em clientes de email e configurar Auth/SMTP com isolamento adequado entre FACODI e Tube.
5. Adicionar testes end-to-end de cadastro, confirmação, recuperação e emails de segurança com contas de teste autorizadas.

**Limite de qualidade:** publicação de links e guias editoriais não equivale a currículo homologado ou revisão integral de conteúdo de terceiros.
