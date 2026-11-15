# FACODI · Enriquecimento de Física, Astronomia, Química e Biologia
**Data:** 15 de novembro de 2026  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid`  
**Schema académico:** `facodi` · **Catálogo de vídeo canónico:** `public.videos`

## Princípio editorial

Prioridade à **organização do material já disponível** em percursos coerentes, sem exercícios gerados, sem copiar ou alojar ficheiros de vídeo e sem promover conteúdos de divulgação a programa oficial das instituições. A ordem foi escolhida editorialmente a partir de **títulos, temas e canais**, não de visualização integral ou validação pedagógica pelos docentes.

Os dados de origem anteriores a esta intervenção foram preservados. A importação utiliza UUIDs determinísticos e relações idempotentes, com `ON CONFLICT` sempre que aplicável. Nenhuma submissão de utilizador ou progresso académico foi fabricado.

## 6 sequências FACODI de Astronomia

| Sequência | Nº de vídeos externos reutilizados | UCs ligadas |
|---|---:|---|
| Astronomia — gravitação, movimento e órbitas | 5 | ASTRO03, ASTRO04 |
| Astronomia — luz, ondas e observação | 4 | ASTRO05 |
| Astrofísica — energia e princípios físicos das estrelas | 4 | ASTRO06 |
| Universo e cosmologia — conversas de divulgação científica | 3 | ASTRO07, ASTRO08 |
| Astronomia — missões espaciais e comunicação científica | 4 | ASTRO01, ASTRO04, ASTRO10 |
| Física do espaço — ondas e tópicos avançados | 4 | ASTRO09 |

**Total:** 6 novas sequências, 24 associações sequência→vídeo, 10 associações sequência→UC e 6 associações sequência→curso. Adicionalmente, 4 relações **reutilizam sequências de Física previamente publicadas** como fundamentos complementares das unidades ASTRO03, ASTRO04, ASTRO05 e ASTRO09. Os mesmos vídeos não são duplicados no banco.

O tema ASTRO02 (esfera celeste e orientação) não tinha vídeos individuais com correspondência segura no catálogo FACODI; não foi criada uma sequência enganadora. Em contrapartida, foi ligada a playlist institucional da UNIVESP/USP como referência externa na secção de materiais.

Os vídeos de divulgação (podcasts, entrevistas, conversas) são identificados como *contextuais* e não como aulas universitárias. Os vídeos avançados de luz e matéria estão identificados como aprofundamento opcional, sem afirmar que abordam integralmente ondas gravitacionais ou astrobiologia.

## 4 coleções para reorganizar sequências pré-existentes

| Coleção | Sequências reutilizadas | Cursos associados |
|---|---:|---|
| Astronomia e Astrofísica — GACS/FACODI | 6 | FACODI-GACS-ASTRO-2018 |
| Física — movimento, energia, termodinâmica, luz e eletricidade | 7 | LESTI, IFES Administração |
| Química — ligações, termologia e reações | 3 | IFES Administração |
| Biologia — genética, microbioma, evolução e ambiente | 5 | IFES Administração |

**Total:** 4 coleções, 21 relações de coleções→playlists, 5 associações curso→coleção. Estas coleções agregam os percursos sem criar novas cópias de vídeos ou novas submissões.

## 2 playlists institucionais externas — UNIVESP/IAG-USP

As páginas institucionais da Universidade de São Paulo identificam duas playlists de aulas produzidas pela UNIVESP, lecionadas pelo professor João Steiner. Estas são **fontes externas** com acesso direto ao YouTube, não vídeos importados ou contabilizados como vídeos novos FACODI.

1. [Astronomia: Uma Visão Geral I](https://www.youtube.com/playlist?list=PLxI8Can9yAHd7kUPviBHxr-49QEl7PRXR) — 35 videoaulas, ligadas às unidades ASTRO01–ASTRO06 e ASTRO10.
2. [Astronomia: Uma Visão Geral II](https://www.youtube.com/playlist?list=PLxI8Can9yAHfJ2sGxMii8mJ6maoCj9AtU) — 31 videoaulas, ligadas às unidades ASTRO07 e ASTRO08.

**Origem institucional:** [IAG-USP — Astronomia: uma visão geral](https://www.aia.iag.usp.br/cultext/materiais/visao-geral-astronomia), e [USP — página do curso e playlists](https://uspdigital.usp.br/apolo/apoObterAtividade?cod_oferecimentoatv=81999).

**Não foram importados 66 vídeos**: foram criados **2 objetos `external_resource` e 9 ligações públicas às UCs**, respeitando direitos de autoria e sem mexer na biblioteca `public.videos`. Não existe afiliação oficial ou equivalência entre estes cursos da USP, as atividades do GACS de 2018 e a FACODI.

## Visibilidade e testes

- `facodi.list_public_editorial_sequences_v1('FACODI-GACS18-ASTRO05')` devolve 2 sequências visíveis para a UC (nova e pré-existente).
- `facodi.list_public_editorial_sequences_v1('FACODI-GACS18-ASTRO03')` devolve 2 sequências para o tema orbital.
- `facodi.get_public_editorial_playlist_v2('facodi-astro-sequence-astro-gravitacao-orbitas')` devolve **5** aulas ordenadas e fontes canónicas YouTube; os percursos de luz e energia devolvem **4** cada.
- **96 sequências públicas** no total após a migração; **884 objetos de vídeo já publicados** permanecem inalterados.
- Quatro novas coleções estão visíveis com o papel `anon`: uma em Astronomia/GACS, uma em LESTI e três no Ifes.
- Sem colisões entre `(parent_object_id,child_object_id,relation_type)`.
- `facodi.external_resource` da UNIVESP I/II acessíveis com papel `anon`, incluindo em ASTRO02.
- Browser público: [sequência de gravitação em facodi.com](https://facodi.com/sequences/facodi-astro-sequence-astro-gravitacao-orbitas) carregou e mostrou as 5 aulas em ordem (UNIVESP e Ciência Sem Fim), com links originais, sem erro de interface. A página de lista não incorpora iframes; a reprodução é feita nas páginas adequadas de recurso/vídeo.

**Segurança:** as migrações não adicionam `SECURITY DEFINER`, não criam papéis, não alteram as políticas RLS existentes nem alteram progressos, matrículas ou dados pessoais. Só foram usados vídeos previamente públicos e referências institucionais externas.

## Migrações aplicadas e versionadas

- `20261115202459_facodi_astro_2026_six_existing_video_learning_sequences.sql`
- `20261115202634_facodi_astro_2026_public_editorial_sequence_rpc_metadata_alignment.sql`
- `20261115202833_facodi_2026_group_existing_science_playlists_in_four_collections.sql`
- `20261115203418_facodi_astro_2026_univesp_usp_official_external_playlist_references.sql`

## Lacunas reais e próximas ações editoriais

- As 66 aulas dos cursos institucionais de Astronomia estão **disponíveis por link oficial**, não indexadas individualmente. Uma importação individual futura exigiria metadados verificados, prevenção de duplicações e escolha de quais vídeos correspondem a cada UC.
- ASTRO09 continua com apenas material introdutório sobre ondas e física espacial; nenhuma aula foi rotulada como explicação integral de astrobiologia ou ondas gravitacionais.
- As sequências não incluem exercícios gerados por IA e não atestam transcrições, licenças de re-hospedagem ou leitura integral de todos os vídeos.
- A estrutura já é consumida pelo frontend através de `list_public_editorial_sequences_v1` e `get_public_editorial_playlist_v2`; as coleções ligam-se aos cursos pelo grafo `learning_object_relations`.

### Verificação adicional no site público

- [Esfera celeste e orientação astronómica — ASTRO02](https://facodi.com/courses/astronomia-astrofisica-gacs-2018/units/gacs-astro-2018-astro02): página React carregada e referência institucional **Astronomia: Uma Visão Geral I** presente em «Leituras e documentação», juntamente com duas referências históricas INPE já existentes.
- A página assinala corretamente que **não há vídeos individuais já classificados** para ASTRO02. A playlist institucional funciona como recurso externo para essa lacuna, sem inflacionar a contagem de aulas FACODI.
- Nenhuma reprodução individual das 66 aulas externas foi testada; apenas a presença e o encaminhamento para a playlist original foram verificados.

## Continuação editorial — 15/11/2026, expansão de observação celeste e astrobiologia

Foram executadas mais **duas migrações de conteúdo**, integradas neste mesmo fluxo e versionadas na branch `facodi`.

### 8 vídeos institucionais novos e 3 sequências

- **UNIVESP / IAG-USP:** 7 vídeos individuais do curso `Astronomia: Uma visão geral I`, com temas de astronomia anterior aos telescópios, história dos instrumentos, observação espacial, espectrógrafos, magnitudes e distâncias, energia estelar e nebulosas.
- **IAG-USP (aula de Rodrigo Nemmen):** 1 vídeo universitário avançado sobre ondas gravitacionais, com referência explícita ao LIGO.

Foram criadas as sequências próprias FACODI:

| Sequência | Vídeos | UCs |
| --- | ---: | --- |
| [Astronomia — história da observação e instrumentos](https://facodi.com/sequences/facodi-astro-sequence-univesp-instrumentos-observacao) | 4 | ASTRO01, ASTRO05 |
| [Astrofísica — luz, distâncias e energia das estrelas](https://facodi.com/sequences/facodi-astro-sequence-univesp-luz-estrelas) | 4 | ASTRO05, ASTRO06 |
| [Ondas gravitacionais — fundamentos físicos e aula universitária](https://facodi.com/sequences/facodi-astro-sequence-ondas-gravitacionais-usp) | 3 | ASTRO09 |

São **11 associações sequência–vídeo**. Três são reutilizações de vídeos já catalogados; oito correspondem aos vídeos individuais novos. Não houve cópia de ficheiros, transcrições ou criação de exercícios. As sequências foram ligadas ao percurso de Astronomia e à coleção `facodi-study-astronomy-gacs-2018`, que passou de seis para nove sequências organizadas.

A identificação dos vídeos novos foi cotejada com páginas públicas do YouTube e com o programa do IAG-USP. O estatuto de `approved` refere-se à adequação por título/descrição e **não** a observação integral, validação de licenças de re-hospedagem ou homologação pela instituição.

Fontes institucionais: [IAG-USP — curso em vídeo](https://www.iag.usp.br/cultext/materiais/visao-geral-astronomia), [programa USP com as aulas e playlists](https://uspdigital.usp.br/apolo/apoObterAtividade?cod_oferecimentoatv=81999).

### 9 referências de videoaulas e materiais no e-Aulas USP/NASA

Foram indexados **9 recursos institucionais externos**, com **13 ligações** às UCs e acesso pelo URL original:

- **USP e-Aulas:** Observar sem ver; Esfera Celeste partes 1 e 2; Sistemas de Coordenadas; Tempo e Calendário; Céu Noturno e Coordenadas; Outros, como o nosso (exoplanetas).
- **NASA:** [Launchpad: Astrobiology](https://science.nasa.gov/eclips/videos/astrobiology/) e [materiais educativos de astrobiologia](https://astrobiology.nasa.gov/classroom-materials/).

Estas referências encontram-se na secção pública **Leituras e documentação**, não em `facodi.youtube_videos`. Isto respeita o facto de os vídeos e-Aulas serem servidos pela USP e terem condições de cópia/redistribuição específicas. Nenhum MP4/legenda foi descarregado ou replicado.

A UC **ASTRO02 — Esfera celeste e orientação astronómica** recebeu seis destes recursos. A UC **ASTRO09 — Ondas gravitacionais e astrobiologia** recebeu três, com uma aula de ondas gravitacionais estruturada como sequência adicional.

Fontes: [USP e-Aulas — Esfera Celeste, parte 1](https://eaulas.usp.br/portal/video.action?idItem=157), [USP e-Aulas — Sistemas de Coordenadas](https://eaulas.usp.br/portal/video.action?idItem=161), [NASA Astrobiology](https://astrobiology.nasa.gov/classroom-materials/).

### Verificações e contagens finais

| Indicador | Antes | Depois |
| --- | ---: | ---: |
| Vídeos educativos FACODI publicados | 884 | **892** |
| Sequências editoriais públicas (consulta `list_public_editorial_sequences_v1`) | 96 | **99** |
| Objetos `external_resource` publicados | 168 | **177** |
| Coleções | 24 | 24 (coleção existente enriquecida) |
| Novas ligações de materiais a UCs | — | 13 |
| Novas sequências com vídeo | — | 3 |

**SQL + RLS, simulando `anon`:** 99 sequências públicas; 4 sequências associadas à ASTRO05, 3 à ASTRO09; 6 novas referências institucionais na ASTRO02 e 3 na ASTRO09. `get_public_editorial_playlist_v2` devolve respetivamente 4, 4 e 3 aulas ordenadas nas novas sequências. Zero pares duplicados no grafo `learning_object_relations`.

**Navegador no domínio Cloudflare `facodi.com`:** foram abertas as páginas públicas, sem sessão e sem modificações. A [sequência de observação](https://facodi.com/sequences/facodi-astro-sequence-univesp-instrumentos-observacao) apresentou as quatro aulas da UNIVESP e um link do YouTube; a [UC Esfera Celeste](https://facodi.com/courses/astronomia-astrofisica-gacs-2018/units/gacs-astro-2018-astro02) apresentou as videoaulas USP partes 1 e 2 e Sistemas de Coordenadas, entre nove referências da secção. Nenhum erro de interface foi reportado. **Não foi feita reprodução individual de todos os vídeos.**

**Migrações desta continuação:**
- `20261115204536_facodi_publish_8_usp_univesp_astronomy_videos_three_sequences_20261115.sql`
- `20261115204814_facodi_astro_2026_9_institutional_eaulas_nasa_video_resources.sql`

Permanecem 10 vídeos em rascunho e 3 documentos por validar: não foram publicados automaticamente por esta intervenção.
