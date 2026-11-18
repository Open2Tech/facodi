# Playlists do YouTube para as UCs da UAlg sem conteúdo

**Data:** 2026-11-18
**Migração:** `supabase/migrations/20261118180000_facodi_uc_gap_playlists_20261118.sql`
**Manifesto:** `supabase/seeds/facodi_uc_gap_playlists_20261118.json`

## Porquê

Nos cinco cursos da UAlg publicados havia 51 UCs sem vídeos, sem sequências e sem playlists. Na página
delas só aparecia a ficha. Ficaram de fora os estágios, projetos, opções e seminários, que não se
preenchem com vídeos.

| Curso | UCs preenchidas | Playlists | Idioma | Confiança |
|---|---:|---:|---|---|
| LESTI | 7 | 14 | 14 pt-BR | 7 alta, 7 média |
| Psicologia (LPSI) | 7 | 14 | 12 pt-BR, 1 pt-PT, 1 en | 6 alta, 7 média, 1 baixa |
| Design de Comunicação (LDCOM) | 20 | 39 | 36 pt-BR, 3 en | 16 alta, 23 média |
| CTeSP STI | 2 | 4 | 4 pt-BR | 1 alta, 3 média |
| Gestão (LGEST) | 15 | 29 | 18 pt-BR, 8 pt-PT, 3 en | 12 alta, 15 média, 2 baixa |
| **Total** | **51** | **100 ligações / 97 playlists** | | |

## Critérios

1. **Correspondência.** Foi feita pelo **programa da ficha oficial da UC** (academico.ualg.pt, 2025/26 e
   2026/27), e não só pelo nome. Os temas de cada UC estão no manifesto (`topics`). Por exemplo, Tecnologias
   I–IV do LDCOM são Photoshop e Illustrator, InDesign, HTML e CSS, e After Effects com motion design.
2. **Quantidade e tamanho.** Até 2 playlists por UC, a melhor primeiro (`position` 91001 e 91002), com
   pelo menos 4 vídeos cada.
3. **Autoria.** Só canais do autor original, conferidos vídeo a vídeo. Ficaram de fora reuploads, cursos
   pirata e compilações de vídeos de outros canais.
4. **Idioma e nível.** Português primeiro: PT-PT quando existe e é bom, PT-BR aceite. Inglês só como
   referência forte (BBC Learning English, CrashCourse, o canal oficial da HeavyM). O nível é superior.
5. **Matérias portuguesas.** Fiscalidade, contabilidade pública e direito só contam se forem de Portugal:
   - Ordem dos Contabilistas Certificados (IVA, IRC, IRS e SNC-AP);
   - CERTFORM;
   - Cascais em Direito (teoria geral do direito civil português).
   
   Conteúdo brasileiro de tributos e direito ficou de fora.

## Verificação

- **No YouTube.** Cada playlist foi confirmada duas vezes, a 18/11/2026: pelo oEmbed (existe, título real,
  canal dono) e pela página da playlist (nº de vídeos). Título, canal e nº de vídeos foram copiados dessa
  verificação.
- **Contra o catálogo público.** As 51 UCs existem, estão publicadas e têm `learning_object_id`. Nenhuma das
  97 playlists já estava no catálogo.
- **Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas e os IDs reais dos
  cursos e UCs:
  - a primeira execução insere 97 playlists e 100 relações;
  - a segunda não altera nada (idempotente);
  - com uma UC despublicada, aborta em "Unpublished/missing academic course or UC";
  - com a playlist já registada noutro objeto, aborta em "manual reconciliation required".

## Modelo (o mesmo de 15/11)

- **`learning_objects`:** cada playlist entra com `object_type='playlist'`, `source_type='youtube'` e
  `source_id` igual ao ID da playlist.
  - A descrição diz o que a playlist cobre.
  - As etiquetas são o nome da UC (não há etiquetas internas).
  - `metadata` regista o canal, o nº de vídeos na verificação, `playlist_owner_verified=true` (pelo
    oEmbed) e `playlist_membership_verified=false`. Ninguém viu todos os vídeos inteiros.
- **`learning_object_relations`:** a relação UC → playlist é `contains`, com `review_status='approved'`.
  Leva ainda `match_confidence`, `content_level` e `match_rationale` (a frase que explica a
  correspondência).
- **IDs:** são determinísticos (`md5('facodi:uc-gaps-20261118:…')`), e todos os inserts usam `ON CONFLICT DO
  NOTHING`.

Na página da UC, as playlists aparecem na secção "Playlists externas recomendadas"
(`useLinkedCatalogAssets(unit.learning_object_id, 'playlist')`).

## Para rever antes de aplicar

- **Confiança baixa (3 ligações):**
  - Contabilidade Pública, com as duas playlists de sessões de perguntas e respostas sobre o SNC-AP da OCC.
    É o único material português e aberto que existe, mas não são aulas.
  - Psicologia e TIC, com a segunda playlist (CrashCourse, *Navigating Digital Information*).
- **Uma só playlist:** Tecnologias II (InDesign) e Introdução ao Direito.
- **Material profissional, não universitário:** fiscalidade e finanças (OCC, CERTFORM). Ficou com confiança
  média.

A migração não apaga nada. Para tirar uma playlist do site depois de aplicada, basta despublicá-la
(`published=false`): a secção da UC só mostra playlists publicadas e ativas.
