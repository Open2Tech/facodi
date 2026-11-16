# Proposta implementada: explorar antes de filtrar

## Objetivo e âmbito

Transformar `/resources` numa entrada orientada ao estudo, sem reconstruir o
catálogo nem confundir um vídeo com uma formação. Este PR altera apenas esta
experiência e os componentes diretamente necessários. A navegação global
fica intacta, conforme a opção confirmada pelo responsável do projeto.

Mantêm-se a identidade de [DESIGN.md](../DESIGN.md), os temas claro e escuro,
as rotas existentes e as regras de publicação do Supabase. Não há migrações,
novas dependências, recomendações personalizadas nem alterações remotas.

## Organização proposta

1. **Intenção primeiro.** Título orientado à aprendizagem e pesquisa com
   debounce, recorrendo ao `SearchInput` existente. Um atalho visível permite
   saltar diretamente para a biblioteca.
2. **Refinar progressivamente.** Todos, módulos, vídeos, documentos e
   referências externas têm atalhos quando existem no resultado. Os outros
   tipos continuam no seletor completo de «Mais filtros». Um tipo selecionado
   pelo URL continua acessível, mesmo com zero resultados.
3. **Descobrir sem uma parede de filtros.** A primeira página sem filtros
   oferece as seis áreas temáticas existentes e uma entrada publicada de
   módulo e de sequência com aulas. O módulo tem descrição; a sequência tem
   capa real quando disponível e número de aulas e UCs. Links separados
   levam às listagens completas, cursos e unidades curriculares.
4. **Procurar sem distrações.** Ao pesquisar, filtrar ou paginar, a descoberta
   sai da composição e a biblioteca fica imediatamente depois dos controlos.
   Vídeos mantêm thumbnail e autoria quando disponíveis; módulos conservam
   a listagem própria e a ligação a `/modules/:slug`.
5. **Filtros com contexto.** Idioma, tipo completo, área e temas ficam num
   painel acessível, não modal. A pesquisa de temas é local, sem acentos e
   sobre as facetas do servidor; não lança um pedido por tecla. O painel tem
   altura de temas limitada e scroll, em vez de dezenas de linhas permanentes.
   A seleção continua visível e removível nos chips fora do painel.

## Dados e contratos preservados

- Biblioteca: `facodi.search_public_resources_v4`, com relevância quando há
  pesquisa e ordem alfabética caso contrário. Não se oferece «popularidade»,
  «mais recentes» ou outros critérios não suportados por este contrato.
- Módulo de entrada: primeira linha do catálogo público filtrado por
  `object_type=module`, na ordem que o servidor devolve. Não representa uma
  recomendação de nível inicial nem uma seleção personalizada.
- Sequência de entrada: primeira sequência com aulas da resposta pública
  `list_public_editorial_sequences_v1`, reutilizando `useSequences` e
  `SequenceList`. Não se consulta uma tabela editorial privada para criar
  destaques.
- Temas: `list_public_resource_topics_v1`, carregada apenas ao abrir os
  filtros; erros têm mensagem e ação de repetição.
- `search`, `language`, `type`, `tag`, `area` e `page` continuam no URL.
  Alterar um filtro repõe a página inicial; limpar filtros repõe também
  o texto da pesquisa. Variantes de idioma continuam a ser tratadas no servidor.
- O total «Todos» inclui os tipos que não cabem nos atalhos. Tipos e relações
  continuam independentes; não há fusão de cursos, UCs, módulos ou playlists.
- A descoberta acrescenta duas consultas públicas em paralelo na entrada
  sem filtros, reutilizando caches existentes. Não é montada em URLs de
  resultados. A consulta de temas deixa de competir com a biblioteca na
  abertura normal.

## Critérios de aceitação

- Procurar e abrir material sem conta; nenhuma alteração a Auth ou permissões.
- Percorrer pesquisa, filtros, áreas e resultados com teclado.
- Abrir um URL filtrado com o painel fechado e perceber os filtros ativos.
- Combinar idioma, tipo e tema, incluindo resultados vazios e tipos
  selecionados sem correspondências.
- Pesquisa rápida não perde caracteres; pesquisa de temas ignora acentos.
- Paginação preserva os filtros e move o foco para os resultados.
- Listagem utilizável mesmo se a descoberta ou as facetas de temas falharem.
- Sem overflow horizontal da página em mobile; filas de atalhos podem ter
  scroll próprio. Contraste e acessibilidade básica verificados nos dois temas.
- Traduções equivalentes em português, inglês, espanhol e francês.

## Limites e próximos passos possíveis

As áreas são sugestões editoriais baseadas nas regras existentes, não
classificações oficiais. Os destaques são entradas determinísticas no
catálogo, não uma promessa de qualidade, revisão integral ou equivalência
académica. Os direitos e a autoria permanecem com as fontes originais.

Uma pesquisa federada que reúna cursos, UCs e sequências numa única resposta,
facetas adicionais de instituição ou dificuldade e uma curadoria explícita
de destaques seriam iniciativas separadas: exigem contratos de dados e
decisões editoriais próprias, não apenas novos botões.

O PR deve passar pelos checks e preview do Cloudflare antes de qualquer
promoção. A abertura do PR não autoriza merge nem publicação em produção.
