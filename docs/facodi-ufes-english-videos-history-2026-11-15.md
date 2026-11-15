# FACODI — UFES Letras Inglês: enriquecimento audiovisual e arquivo curricular
**Data:** 2026-11-15  
**Supabase:** `wvkjainfwsyiyfcmbtid` · schema `facodi`  
**Repositório:** `Open2Tech/facodi` · branch `facodi`  
**Curso:** `UFES-LETRAS-ING-83-2019` · https://facodi.vercel.app/courses/ufes-letras-ingles

## Resumo verificado no Supabase
- **75 UCs públicas**, PPC 2019 UFES.
- **87 vídeos externos** rastreáveis à origem: 48 Crash Course, 23 British Council TeachingEnglish, 16 UNIVESP.
- **291 relações públicas vídeo–UC**: 140 Crash Course, 112 British Council, 39 UNIVESP. **60/75 UCs** com pelo menos um vídeo curado; as restantes 15 mantêm referências escritas em vez de vídeos pouco relacionados.
- **8 coleções próprias FACODI**: 2 Crash Course, 3 British Council, 3 UNIVESP. Não são playlists oficiais dos produtores nem da UFES.
- Mantidas **36 referências escritas distintas** e **152 associações UC–leitura** (100% das 75 UCs com pelo menos uma leitura), além de 225 objetivos e 225 competências editoriais anteriores.
- Criado **arquivo histórico público de 2006**: 67 componentes do PPC 2006 e 232 pares listados como equivalências no PPC 2019. **Não** significa atribuição automática de créditos.
- Mantidos **75 percursos de UCs e 1 mapa curricular em `draft`**; sem publicação de roteiros gerados e sem fingir aprovação docente.

## 1. Vídeos de Linguística e Literatura (Crash Course)
**Fonte original do produtor:** https://thecrashcourse.com/topic/linguistics/ e https://thecrashcourse.com/topic/literature/

Foram visitadas 48 páginas individuais de episódios e lidas as URLs do iframe YouTube do produtor, obtendo IDs reais de 11 caracteres e títulos publicados. 16 episódios de Linguística abordam morfologia, sintaxe, semântica, pragmática, sociolinguística, fonética, aquisição da linguagem, linguística computacional e sistemas de escrita; 32 episódios de Literatura abordam análises de poesia, Shakespeare, romances dos séculos XIX a XXI, estudos culturais e crítica literária.

As 140 relações em `facodi.learning_object_relations` guardam `review_status='approved'`, `review_scope='title_and_channel_only'`, `full_video_reviewed=false`, origem YouTube e metadata de autoria/curadoria. A aprovação refere-se **à seleção temática**, não a avaliação integral das aulas.

## 2. Formação de professores (British Council TeachingEnglish)
**Fonte:** canal verificado `@BritishCouncilTeachingEnglish`, ID `UCpGyg_swrp18MdGhFkZIPpA` e vídeos YouTube de referência.

23 vídeos seleccionados, divididos em 3 roteiros FACODI:
- Planeamento de aulas, decisões metodológicas e desenvolvimento profissional docente (6).
- Gramática, pronúncia, materiais autênticos, canções, rimas e comunicação (9).
- Diferenciação pedagógica, inclusão e atividades adaptadas (8).

Foram feitas 112 associações a UCs de Metodologias de Ensino, Práxis, Estágio, Didática, Educação e Diversidade, Inglês Oral, Gramática e outros temas claramente correspondentes.

## 3. Educação e pesquisa (UNIVESP)
**Fonte:** canal `@univesptv`, ID `UCBL2tfrwhEhX52Dze_aO3zA`.

16 vídeos selecionados com 39 relações:
- História social da educação, escola nova, Era Vargas, formação docente e sociologia da educação (5).
- Políticas educacionais e fundamentos do currículo escolar (4).
- Métodos de pesquisa, escrita científica e Trabalho de Conclusão de Curso (7).

Títulos de alguns vídeos resultam de localização do sistema de pesquisa YouTube: `title_may_be_localized=true`. Não se presume transcrição de episódios completos, nem afiliação UFES à UNIVESP.

## 4. Modelo e segurança
Tudo foi realizado exclusivamente no schema `facodi`, sem Odoo e **sem alterar nem duplicar vídeos da tabela `public.videos` do Tube**. Foram utilizados:
- `facodi.learning_objects` para os vídeos e coleções;
- `facodi.youtube_videos` para IDs e URLs originais;
- `facodi.learning_object_relations` para relações temáticas e pertença às coleções;
- `facodi.external_sources` para proveniência;
- `facodi.course_curriculum_archives` para o plano histórico.
IDs determinísticos garantem que uma migração não duplica registos. Todas as relações respeitam a RLS pré-existente que exige ambos os objetos públicos/ativos e revisão aprovada. Os links apontam para vídeos hospedados no YouTube: não foi transferida, espelhada nem disponibilizada uma cópia dos ficheiros audiovisuais; a licença de redistribuição não foi assumida.

**Verificação efetiva:** sob `SET LOCAL ROLE anon`, os 87 vídeos e 291 relações estavam visíveis, o currículo de 2006 era legível e o papel anónimo não conseguia ler `facodi.generated_structures`.

### 2006 → 2019: arquivo de currículo e equivalências
PPC anterior: https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciatura_2006_0.pdf  
PPC atual de referência: https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf

O PPC 2006 identifica o plano como *Ativa Anterior*, com 49 disciplinas obrigatórias (2.640 horas), 2 estágios de 200 horas cada, 15 componentes apenas para aproveitamento e uma oferta optativa. O histórico guardou os **67 códigos** sem os tratar como todas obrigatórias. A tabela de equivalências do PPC 2019 contém **232 pares listados**; cada par está preservado em `comparison.listed_equivalences` junto do arquivo 2006. O significado administrativo deve ser analisado pela universidade; não é autorização automática de equivalência ou transferência.

A tabela `facodi.course_curriculum_archives` exigia `programme_ects NOT NULL`, incompatível com currículos brasileiros. Foi alterada para permitir `NULL`. A interface `CurriculumArchive` agora mostra **horas brasileiras** quando não há ECTS, com quatro anos de visualização, componentes históricos de aproveitamento, categorias e tabela dobrável com as 232 correspondências. A página de Letras Inglês agora inclui o arquivo: anteriormente o componente estava limitado à LGEST.

## 5. Migrações aplicadas e versionadas
- `20261115060847_facodi_ufes_english_48_verified_crashcourse_videos_and_educational_collections.sql`
- `20261115061340_facodi_curriculum_archives_allow_null_ects_for_brazil.sql`
- `20261115061434_facodi_ufes_letras_ingles_archive_2006_curriculum_and_2019_equivalence_table.sql`
- `20261115062017_facodi_ufes_english_teaching_23_verified_british_council_videos.sql`
- `20261115062429_facodi_ufes_english_16_univesp_education_research_videos.sql`

Todas passaram por simulação `BEGIN … ROLLBACK` antes da aplicação. As migrações SQL foram recuperadas da tabela `supabase_migrations.schema_migrations` e versionadas sem adivinhar nomes ou números.

## 6. Verificação de frontend e limitações
A página `/courses/ufes-letras-ingles` mostra os vídeos recém-adicionados. A UC de TCC `/courses/ufes-letras-ingles/units/ufes-ingles-let13932` foi verificada com objetivos e seis vídeos apresentados após a integração. O componente de arquivo foi habilitado em `CourseDetails.tsx` e requer deploy de produção com commit que contém essa alteração.

O conteúdo de terceiros não foi transcrito nem reproduzido; a validação foi de URL/ID, canal, título e pertinência temática, **não visualização integral ou autenticação de legenda**. Também não se criaram alunos, matrículas, avaliações, certificações, playlists no Tube ou equivalências académicas fictícias. Para as 15 UCs sem vídeos de fonte adequada, a biblioteca de referências escritas é preferível a correspondências forçadas.

A segurança do Supabase continua com alguns avisos preexistentes fora deste escopo (`vector` em `public`, funções `SECURITY DEFINER` pré-existentes e proteção contra passwords comprometidas). Nenhuma função privilegiada nova foi introduzida nesta fase.
