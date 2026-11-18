# Património Cultural e Arqueologia — UAlg 1685

**Estado em 18/11/2026:** curso publicado e enriquecimento aplicado em Supabase. Acesso público verificado com o papel `anon`, incluindo as sequências devolvidas pelos RPCs usados no frontend.

- [Curso na FACODI](https://facodi.com/courses/patrimonio-cultural-arqueologia)
- [Apresentação oficial](https://www.ualg.pt/curso/1685) e [plano oficial](https://www.ualg.pt/curso/1685/plano).
- Manifesto do plano: `supabase/seeds/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118.json`.
- Manifesto do enriquecimento, associações e arquivo: `supabase/seeds/facodi_ualg_1685_enrichment_20261118.json`.

## Plano oficial atual

Licenciatura da Faculdade de Ciências Humanas e Sociais da Universidade do Algarve, com 180 ECTS e seis semestres. O plano de 2026/27 tem dois anos comuns e os ramos de Arqueologia e Património Cultural no terceiro ano.

A auditoria confirmou **43 UCs únicas e 65 colocações curriculares**, correspondentes à página oficial. Os registos existentes foram reutilizados. As alternativas de ramo, semestre e opção permanecem em `curriculum_placements`; não se somam alternativas para calcular os 180 ECTS. Os resumos e temas registados foram preservados, assim como os links das fichas oficiais disponíveis. Os três seminários não apresentam ficha própria na página do plano.

**Seminários anuais:** O plano oficial apresenta seminários anuais de 10 ECTS em grupos de opção. A página não explicita a regra de substituição das opções semestrais; preservam-se os grupos e os 180 ECTS oficiais sem somar alternativas nem inferir equivalências.

As 28 associações a playlists externas já existentes foram preservadas, correspondendo a 27 objetos únicos de playlist. Estas ligações não significam importação integral dos vídeos das playlists.

## Enriquecimento publicado

| Elemento | Quantidade |
|---|---:|
| Vídeos distintos associados às UCs | 160 |
| Novos vídeos no catálogo FACODI | 143 |
| Vídeos existentes reutilizados | 17 |
| Leituras, guias e coleções externas | 19 |
| Sequências editoriais | 17 |
| Ligações diretas UC → vídeo | 227 |
| Ligações diretas UC → leitura | 48 |
| Ligações UC → sequência | 23 |
| Itens ordenados nas sequências | 161 |
| UCs com algum recurso complementar | 43 |

O vídeo do museu de Mora integra dois percursos pertinentes; por isso há 161 itens para 160 vídeos únicos. As sequências agrupam temas e reutilizam os vídeos, sem criar uma camada adicional de módulos.

### Fontes e critério editorial

As fontes audiovisuais incluem MASB, USP, UNIVESP, ERA Arqueologia, Património Cultural, I.P., ICOM Portugal, encontros de museologia e CrashCourse. Os vídeos de Dani Porto e Apreciando Arte já presentes no catálogo foram reaproveitados.

A seleção foi feita por correspondência temática entre título, canal e programas oficiais das UCs. Foram verificados nas páginas públicas de cada vídeo: identificador, título, autor/canal, duração, miniatura e URL canónico, bem como o estado público devolvido no momento da consulta. Os 160 vídeos passaram essa verificação. Não houve reprodução nem revisão integral das aulas; a aprovação das relações tem o âmbito `title_and_channel_only`.

Os casos da Ossonoba/Faro, Milreu e Portimão acrescentam contexto regional. Casos breves da ERA, reportagens, debates e reconstituições digitais recebem identificação de formato nos metadados. Os modelos 3D são interpretativos; os vídeos de um minuto não são apresentados como formação técnica completa.

O vídeo de datação `Ja19tWMACAw` foi excluído porque a página devolveu `LOGIN_REQUIRED` e não permitiu verificar metadados públicos completos. A indisponibilidade não foi contornada.

A série de história grega publicada pela UNIVESP mantém idioma `und`: os títulos portugueses não demonstram o idioma do áudio ou das legendas. As restantes indicações de idioma seguem as fontes da seleção.

### Sequências

| Percurso | Vídeos | Slug |
|---|---:|---|
| Arqueologia: evidências, sítios e materiais | 4 | `facodi-lpca-introducao-arqueologia` |
| Pré-história: tempo, fósseis e evolução humana | 12 | `facodi-lpca-evolucao-pre-historia` |
| História da arte: observar e interpretar | 10 | `facodi-lpca-arte-observacao` |
| Cultura clássica: história da Grécia antiga | 24 | `facodi-lpca-cultura-classica-grecia` |
| Ossonoba: arqueologia romana em Faro | 6 | `facodi-lpca-ossonoba-faro` |
| Paisagens antigas: castros e megalitismo | 10 | `facodi-lpca-castros-megalitismo` |
| Arqueociências: prospeção remota e geofísica | 6 | `facodi-lpca-prospecao-geofisica` |
| Museus: ética e responsabilidade profissional | 6 | `facodi-lpca-museus-etica` |
| Museus de arqueologia: território e comunidades | 8 | `facodi-lpca-museus-comunidades` |
| Património português: mediação e visitas digitais | 8 | `facodi-lpca-patrimonio-digital` |
| Cultura moderna: humanismo, religião e transformações sociais | 12 | `facodi-lpca-cultura-moderna` |
| Cultura contemporânea: revoluções e sociedade | 13 | `facodi-lpca-cultura-contemporanea` |
| Historiografia: autores, problemas e história cultural | 11 | `facodi-lpca-historiografia` |
| Arte antiga e medieval: formas, contextos e edifícios | 9 | `facodi-lpca-arte-antiga-medieval` |
| Arte moderna: Renascimento, Maneirismo e Barroco | 5 | `facodi-lpca-arte-renascimento-barroco` |
| Estética e cultura visual: valor, autoria e espaço público | 13 | `facodi-lpca-estetica-cultura-visual` |
| Arqueologia medieval: a necrópole dos Lagares | 4 | `facodi-lpca-mouraria-medieval` |

### Leituras e guias técnicos

As páginas dos próprios editores/instituições foram consultadas. Os textos abaixo são referências complementares, não bibliografia obrigatória aprovada pela UAlg. As descrições são sínteses editoriais; os textos integrais não foram copiados.

| Recurso | Instituição / editor | Idioma |
|---|---|---|
| [Animal Bones and Archaeology: Recovery to Archive](https://historicengland.org.uk/images-books/publications/animal-bones-and-archaeology/) | Historic England | en |
| [A Standard for Pottery Studies in Archaeology](https://historicengland.org.uk/images-books/publications/standard-for-pottery-studies-in-archaeology/) | Historic England / PCRG, SGRP e MPRG | en |
| [Organic Residue Analysis and Archaeology](https://historicengland.org.uk/images-books/publications/organic-residue-analysis-and-archaeology/) | Historic England | en |
| [Managing Lithic Sites](https://historicengland.org.uk/images-books/publications/managing-lithic-sites/) | Historic England | en |
| [Marine Survey: Surface Survey Techniques](https://guides.archaeologydataservice.ac.uk/marine/mande-marinesurveytechniques-surface/) | Archaeology Data Service | en |
| [ICOM — Code of Ethics for Museums](https://icom.museum/en/resources/standards-guidelines/code-of-ethics/) | ICOM | en |
| [Carta de Veneza — conservação e restauro](https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf) | ICOMOS | en |
| [Understanding Historic Buildings: A Guide to Good Recording Practice](https://historicengland.org.uk/images-books/publications/understanding-historic-buildings/) | Historic England | en |
| [Drawing for Understanding](https://historicengland.org.uk/images-books/publications/drawing-for-understanding/) | Historic England | en |
| [Understanding the Archaeology of Landscapes](https://historicengland.org.uk/images-books/publications/understanding-archaeology-of-landscapes/) | Historic England | en |
| [Princípios de Valletta — cidades e áreas urbanas históricas](https://civvih.icomos.org/valletta-principles-portugese/) | ICOMOS / CIVVIH | pt |
| [UNESCO — arte rupestre do Vale do Côa e Siega Verde](https://whc.unesco.org/en/list/866/) | UNESCO World Heritage Centre | en |
| [Zotero — primeiros passos na gestão bibliográfica](https://www.zotero.org/support/quick_start_guide) | Zotero | en |
| [Seca, adaptação agrícola e colapso sociopolítico na área maia](https://pmc.ncbi.nlm.nih.gov/articles/PMC4426404/) | PNAS / PubMed Central | en |
| [Hesíodo — Teogonia (tradução inglesa)](https://chs.harvard.edu/primary-source/hesiod-theogony-sb/) | Harvard University — Center for Hellenic Studies | en |
| [Património Cultural 360 — visitas e objetos digitais](https://360.patrimoniocultural.gov.pt/) | Património Cultural, I.P. | pt |
| [Women Artists in Nineteenth-Century France](https://www.metmuseum.org/essays/women-artists-in-nineteenth-century-france) | The Metropolitan Museum of Art — Nicole Myers | en |
| [Earthen Architecture Conservation — recursos de ensino](https://www.getty.edu/research-conservation/teaching-learning-resources/earthen-architecture-conservation/) | Getty Conservation Institute | en |
| [Internet Medieval Sourcebook — fontes para a história medieval](https://sourcebooks.fordham.edu/sbook.asp) | Fordham University — Paul Halsall | en |

Guias da Historic England incluem práticas e enquadramentos britânicos: a transferência metodológica exige contextualização portuguesa. A Carta de Veneza é uma referência histórica. Para ética museológica deve consultar-se a versão e a data indicadas na página oficial do ICOM, em vez de assumir que um debate antigo contém orientações atuais.

## Cobertura por unidade curricular

Contagens públicas da vista `facodi.course_unit_content_coverage`, após aplicação. Vídeos e leituras contam relações diretas; uma sequência pode apoiar mais de uma UC.

| Código | Unidade curricular | Vídeos | Leituras | Sequências |
|---|---|---:|---:|---:|
| 16851000 | Introdução à Arqueologia | 10 | 1 | 1 |
| 16851005 | Introdução à História Cultural | 15 | 0 | 1 |
| 16851001 | Introdução à História da Arte | 6 | 0 | 1 |
| 16851003 | Introdução ao Património Cultural | 5 | 3 | 0 |
| 16851124 | Metodologia de Trabalho Científico | 0 | 2 | 0 |
| 16851006 | Pré-História | 12 | 2 | 1 |
| 16851009 | Arqueologia Romana | 8 | 0 | 1 |
| 16851008 | História da Arte da Antiguidade | 4 | 0 | 1 |
| 16851007 | História da Cultura Clássica | 24 | 1 | 1 |
| 16851122 | Itinerários do Património | 5 | 2 | 1 |
| 16851123 | Materiais e Técnicas de Construção Tradicional | 0 | 2 | 0 |
| 16851060 | Proto-História | 5 | 0 | 1 |
| 16851013 | História da Arte Medieval | 5 | 0 | 1 |
| 16851012 | História da Cultura Medieval | 0 | 1 | 0 |
| 16851160 | Metodologias de Intervenção em Património Construído | 2 | 3 | 0 |
| 16851027 | Museologia | 16 | 1 | 2 |
| 16851157 | Arqueologia Marítima e Costeira | 0 | 1 | 0 |
| 16851155 | Estudos de Megalitismo | 5 | 0 | 1 |
| 16851156 | Mitologia Greco-Romana | 0 | 1 | 0 |
| 16851011 | Arqueologia Medieval | 4 | 0 | 1 |
| 16851097 | Arqueologia Urbana | 6 | 1 | 1 |
| 16851015 | História da Arte Moderna | 5 | 0 | 1 |
| 16851014 | História da Cultura Moderna | 12 | 0 | 1 |
| 16851143 | Arqueologia da Alimentação | 0 | 3 | 0 |
| 16851053 | Estética e Teorias da Arte | 9 | 0 | 1 |
| 16851016 | História da Cultura Contemporânea | 13 | 0 | 1 |
| 16851159 | História do Pensamento Historiográfico e Arqueológico | 12 | 0 | 1 |
| 16851032 | Técnicas de Análise Laboratorial: Cerâmicas | 2 | 2 | 0 |
| 16851030 | Técnicas de Análise Laboratorial: Faunas | 0 | 1 | 0 |
| 16851121 | História da Arte Portuguesa | 2 | 1 | 0 |
| 16851024 | Representação Gráfica do Património Construído | 3 | 4 | 0 |
| 16851070 | Introdução ao Estudo das Imagens Medievais | 3 | 0 | 0 |
| 16851114 | Arqueociências | 10 | 3 | 1 |
| 16851029 | Gestão do Património Cultural | 12 | 2 | 1 |
| 16851018 | História do Urbanismo | 2 | 2 | 0 |
| 16851031 | Técnicas de Análise Laboratorial: Líticos | 0 | 1 | 0 |
| 16851144 | Sustentabilidade e Colapso de Sociedades do Passado | 0 | 1 | 0 |
| 16851025 | História da Arte Contemporânea | 6 | 1 | 1 |
| 16851125 | História da Cultura Portuguesa | 2 | 1 | 0 |
| 16851158 | O Género na Arte e na Cultura Visual do Ocidente | 2 | 1 | 0 |
| 16851134 | Seminário de Investigação (área ARQ) | 0 | 1 | 0 |
| 16851148 | Seminário de Investigação (área H) | 0 | 2 | 0 |
| 16851154 | Seminário de Investigação (área HA) | 0 | 1 | 0 |

Há **17 UCs com vídeos e leituras, 14 apenas com vídeos e 12 apenas com leituras**. Ter algum recurso não demonstra cobertura integral do programa. Nos seminários, o apoio é instrumental (gestão bibliográfica), sem inventar temas de investigação. História da Arte Portuguesa, Imagens Medievais e Cultura Portuguesa conservam apoios e casos parciais. Permanecem oportunidades para fontes portuguesas de nível superior e demonstrações laboratoriais mais extensas.

## Arquivo de 2025/26

A mesma página oficial disponibiliza o plano anterior. Foi guardado em `facodi.course_curriculum_archives`, separado do plano ativo, com **46 UCs únicas e 67 colocações**. Cada UC histórica guarda as suas colocações de ramo/ano/semestre/grupo, sem criar novas UCs ativas.

A comparação encontra **32 códigos comuns**, 14 exclusivos do arquivo e 11 exclusivos do plano atual. É uma comparação literal de códigos; não estabelece equivalências académicas. O manifesto preserva os códigos e os links oficiais de ambos os contextos.

## Aplicação e validação

As operações foram exclusivamente de dados no esquema `facodi`, através de transações com chave de reutilização por ID do YouTube/URL e relações únicas. Não foram acrescentadas migrações ou modificadas tabelas, políticas, autenticação ou funções.

A verificação posterior com `SET LOCAL ROLE anon` confirmou:

- curso publicado, 180 ECTS e seis semestres;
- 43 UCs e 65 colocações atuais;
- 160 vídeos e 19 leituras visíveis, com 227 e 48 associações diretas;
- 17 sequências listadas por `list_public_editorial_sequences_v1`;
- todas as sequências com contagem de metadados verificados igual à contagem de itens em `get_public_editorial_playlist_v2`;
- arquivo publicado de 2025/26, com 46 entradas e 67 colocações;
- nenhuma UC sem pelo menos um apoio complementar.

Os manifestos foram validados quanto a identificadores únicos, referências entre vídeos e sequências, metadados públicos e contagens do arquivo. Não foi necessário alterar código do frontend; os dados utilizam os contratos existentes.

A publicação consiste em links para os criadores e editores originais. Não foram copiados vídeos, transcrições ou leituras integrais, nem recolhidos ou publicados dados do histórico pessoal do utilizador.
