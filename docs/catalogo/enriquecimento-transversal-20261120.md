# Enriquecimento transversal dos cursos — 20 de novembro de 2026

**Estado:** publicado diretamente no Supabase de produção, projeto `wvkjainfwsyiyfcmbtid`, esquema `facodi`.  
**Lote editorial:** `facodi_cross_course_enrichment_20261120`.  
**Âmbito:** 16 cursos publicados do catálogo FACODI, incluindo licenciaturas, CTeSP e a licenciatura em Letras–Inglês da UFES.  
**Frontend:** a [PR #123](https://github.com/Open2Tech/facodi/pull/123) já tinha estabelecido a agregação de referências de UCs na página do curso; este lote fornece mais fontes e associações a essa estrutura existente. Não se criaram novas tabelas, páginas, funções RPC ou permissões.

## Critério de enriquecimento

1. Priorizar UCs publicadas cuja biblioteca estava limitada a playlists ou que não tinham referências documentais.
2. Usar apenas **links externos e metadados** de fontes oficiais, institucionais, universitárias ou da entidade autora. Não copiar livros, apostilas, aulas ou trabalhos de terceiros.
3. Reutilizar um objeto de aprendizagem preexistente sempre que o seu `source_url` ou `source_id` já exista, sem criar duplicados.
4. Relacionar recursos com UCs de correspondência temática controlada; reutilizações entre cursos por códigos iguais foram verificadas contra o título e conteúdo do recurso, com seleção explícita de fontes.
5. Usar `contains` e metadados de curadoria nos vínculos, **sem** converter playlists externas em sequências editoriais FACODI nem inventar progresso do estudante.
6. Tratar os materiais como **complementos**: não equivalem a fichas de unidade curricular oficiais, avaliação institucional ou certificação UAlg/UFES.

## Resultados auditados

- **17** novos `learning_objects` de tipo `external_resource` publicados.
- **3** novos `learning_objects` de tipo `video`, espelhados em `facodi.youtube_videos` com referência aos autores originais.
- **181** novas relações `contains` (`metadata.curation_batch='facodi_cross_course_enrichment_20261120'`).
- **16** cursos e **148** UCs distintas receberam pelo menos uma nova associação.
- Consulta `SET LOCAL ROLE anon`: **17 referências + 3 vídeos + 181 relações** visíveis.
- **0 vínculos novos** apontando para recursos não publicados ou indisponíveis segundo os estados do catálogo.

### Impacto por curso

| Curso (slug) | UCs enriquecidas | Associações novas |
|---|---:|---:|
| `ciencias-educacao-formacao` | 19 | 22 |
| `patrimonio-cultural-arqueologia` | 11 | 22 |
| `bioquimica` | 15 | 20 |
| `engenharia-eletrotecnica-computadores` | 13 | 17 |
| `ciencias-biomedicas` | 13 | 16 |
| `marketing` | 14 | 16 |
| `engenharia-civil` | 9 | 12 |
| `ctesp-marketing-digital` | 9 | 10 |
| `ldcom` | 10 | 10 |
| `ufes-letras-ingles` | 9 | 9 |
| `economia` | 7 | 7 |
| `ctesp-desenho-modelacao-digital` | 6 | 6 |
| `desporto` | 6 | 6 |
| `lesti` | 3 | 4 |
| `matematica-aplicada-economia-gestao` | 3 | 3 |
| `ctesp-sti` | 1 | 1 |
| **Total** | **148** | **181** |

Os restantes cursos já tinham referências e materiais anteriores, pelo que esta ronda **não** lhes acrescentou objetos desnecessários.

## Fontes acrescentadas e reutilizadas

### Ciência, saúde e dados

- [EMBL-EBI — Introdução à Bioinformática](https://www.ebi.ac.uk/training/online/courses/introductory-bioinformatics-pathway/) e [métodos de Bioinformática](https://www.ebi.ac.uk/training/online/courses/methods-in-bioinformatics/): Bioquímica e Ciências Biomédicas.
- [OpenStax Biology 2e](https://openstax.org/books/biology-2e/pages/1-introduction) e [Chemistry 2e](https://openstax.org/books/chemistry-2e/pages/1-introduction): biologia celular, genética, química, fundamentos das ciências da vida.
- Reutilizado o objeto já existente [OpenStax University Physics](https://openstax.org/books/university-physics-volume-1/pages/1-introduction): cursos com Física e Física Aplicada.
- [Eurostat — Statistics for beginners](https://ec.europa.eu/eurostat/web/european-statistics-learning-hub/statistics-for-beginners): literacia estatística em dez cursos.
- [Rede de Bibliotecas Escolares — Khan Academy em português](https://www.rbe.mec.pt/np4/1493.html): apoio de base à Matemática e ao Cálculo.

### Tecnologia, engenharia e design

- [MIT — Circuits and Electronics](https://learn.mit.edu/c/department/mechanical-engineering?resource=4717): Análise de Circuitos e Eletrónica.
- [Autodesk Learn — AutoCAD e Revit](https://www.autodesk.com/learn/catalog/product/AutoCAD,Revit): BIM, CAD e modelação 3D; atenção às condições de licença do software.
- Reutilizado o objeto preexistente [Adobe Learn](https://www.adobe.com/learn): design de comunicação, ilustração e produção gráfica.
- [MDN — Aprender desenvolvimento web](https://developer.mozilla.org/pt-BR/docs/Learn_web_development): desenvolvimento de aplicações e tecnologias web.
- Reutilizado [Microsoft — Excel](https://support.microsoft.com/pt-pt/excel/) para Informática, Estatística Aplicada e Métricas.

### Economia, marketing e educação

- [Google Skillshop — Google Ads](https://skillshop.withgoogle.com/intl/pt-PT_ALL/googleads/) e [Percursos Analytics/medição](https://support.google.com/skillshop/answer/14741235?hl=pt): publicidade de pesquisa, marketing digital e métricas.
- [DGE — Recursos Educativos](https://dge.mec.pt/recursos-educativos) e [boas práticas](https://www.dge.mec.pt/recursosboas-praticas): práticas pedagógicas, avaliação e projetos educativos.
- Reutilizados os objetos já existentes de IAPMEI (empreendedorismo) e da CNC (SNC), apenas nas UCs correspondentes.
- Foram reaproveitadas referências selecionadas de Psicologia, Automação e Marketing de outras UCs com **mesmo código e título**, incluindo capítulos de OpenStax, playlists com temas adequados e fontes de Arduino, FPGA e Google.

### Património, desporto e ensino de Inglês

- [Património Cultural, I.P. — Arqueologia](https://www.patrimoniocultural.gov.pt/profissionais/arqueologia/) e [arquivos técnicos](https://www.patrimoniocultural.gov.pt/servicos/arquivos/): património cultural, metodologias arqueológicas e investigação.
- [IPDJ — Programa Nacional de Formação de Treinadores](https://ipdj.gov.pt/programa-nacional-de-formacao-de-treinadores): fundamentos e enquadramento profissional do Desporto.
- [British Council — Digital competences for teaching English](https://www.teachingenglish.org.uk/training/courses/digital-competences-teaching-english): metodologia, ensino de inglês e tecnologias educativas no curso da UFES.

## Vídeos originais catalogados

| Unidade curricular | Vídeo | Autoria | Limitação |
|---|---|---|---|
| Bioinformática, Genómica Funcional e Fundamentos de Bioinformática | [An introduction to EMBL-EBI resources](https://www.youtube.com/watch?v=KrIvrTWtPbE) | EMBL-EBI, 2025 | Introdução em inglês; a palestra não substitui conteúdo prático completo |
| BIM na Arquitetura / Estruturas e Modelação BIM | [Free Course: Learn Revit in 90 Minutes](https://www.youtube.com/watch?v=DLyc1DIRNqQ) | Autodesk Education, 2026 | Focado em Revit; sujeito aos requisitos de software |
| Análise de Circuitos I/II e Eletrónica I | [Lec 1 — MIT 6.002 Circuits and Electronics](https://www.youtube.com/watch?v=AfQxyVuLeCs) | MIT OpenCourseWare, 2007 | Aula histórica, fundamentos em inglês |

Seleção por título, descrição pública e canal; `full_video_reviewed=false` nos três vídeos. Nenhuma alegação de que os três vídeos foram revistos integralmente ou produzidos pela UAlg/UFES. Foram relacionadas 9 combinações vídeo–UC; sem duplicações de `source_id`.

## Verificação, limites e oportunidades seguintes

- As 181 relações são **relações**, não 181 objetos únicos. Alguns recursos são reutilizados em várias UCs.
- Não foram modificados os códigos, ECTS, regimes ou dados oficiais dos cursos.
- Não foram criadas fichas pedagógicas completas artificiais para centenas de UCs.
- A publicação e RLS foram validadas diretamente no esquema `facodi`; **não** foi executado um teste visual ponta a ponta no site.
- Apesar do avanço, permanecem muitas UCs sem referência específica em cursos extensos, incluindo Engenharia Eletrotécnica, Bioquímica, Ciências Biomédicas e Matemática Aplicada à Economia e Gestão; futuras rondas devem preferir **qualidade e adequação por UC**, não apenas elevar contagens.
- Próxima prioridade: mapear sequências editoriais reais a partir de vídeos efetivamente revistos, consultar FUC oficiais atuais quando acessíveis, validar links externos em rotas reais do frontend e aprofundar UCs sem material.

---

## Aprofundamento por UC — segunda e terceira rondas (2026-11-20)

**Lotes:** `facodi_cross_course_deepening_20261120_v2` e `facodi_cross_course_deepening_20261120_v3`. Foram carregados no Supabase diretamente, mantendo as estruturas, as políticas RLS e as relações `contains` já existentes.

### Resultados confirmados na produção

- **25 referências externas novas** e **2 vídeos novos** = **27 novos objetos de aprendizagem**, todos publicados.
- **119 novas relações `contains`**, distribuídas por **98 UCs distintas em 6 cursos**.
- Os registos novos reutilizam as mesmas fontes quando já existiam no catálogo: `Calc 1`, `Calc 3`, `Introductory Statistics 2e`, `Python Tutorial`, `Arduino Learn`.
- Todos os **119 vínculos, 25 recursos e 2 vídeos** foram visíveis com `SET LOCAL ROLE anon`, sem alterar RLS.
- Verificação de integridade: **0 objetos de destino ausentes ou não publicados**, **0 vídeos novos sem registo em `facodi.youtube_videos`**.
- Uma ligação anterior do MIT foi corrigida: `facodi-cross-course-20261120-mit-circuits` apontava para `learn.mit.edu/c/department/mechanical-engineering?resource=4717`; passa a apontar para o curso **6.002 Circuits and Electronics** no MIT OpenCourseWare: <https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/>. A URL anterior foi guardada em `metadata.previous_url`, preservando o ID e as associações já existentes.

| Curso | UCs com novas associações | Novas relações |
|---|---:|---:|
| `engenharia-eletrotecnica-computadores` | 22 | 28 |
| `ciencias-biomedicas` | 24 | 26 |
| `bioquimica` | 20 | 21 |
| `matematica-aplicada-economia-gestao` | 13 | 17 |
| `ctesp-desenho-modelacao-digital` | 10 | 14 |
| `engenharia-civil` | 9 | 13 |
| **Total** | **98** | **119** |

Os novos recursos aparecem nas páginas públicas dos cursos e UCs através dos vínculos já existentes; a alteração desta ronda **não** requer PR de frontend nem migração de base de dados.

### Matemática, Estatística e Investigação Operacional

- [MIT 18.06SC — Álgebra Linear](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/) — matrizes, espaços vetoriais e sistemas lineares; usado em Matriz e Aplicações, Álgebra Linear e Geometria Analítica.
- [MIT 18.03SC — Equações Diferenciais](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/) — equações de primeira ordem, Laplace, sistemas e modelação em ciências/engenharia.
- [OpenStax Calculus Volumes 1](https://openstax.org/books/calculus-volume-1/pages/1-introduction), [2](https://openstax.org/books/calculus-volume-2/pages/1-introduction) e [3](https://openstax.org/books/calculus-volume-3/pages/1-introduction) — limites/derivadas, integração/séries e cálculo multivariável, associados às UCs específicas.
- [OpenStax Introductory Statistics 2e](https://openstax.org/books/introductory-statistics-2e/pages/1-introduction) — probabilidade, inferência e regressão como apoio introdutório. Não foi apresentado como livro avançado de bioestatística.
- [Python Tutorial](https://docs.python.org/3/tutorial/) — introdução e laboratórios de programação.
- [SciPy Optimize](https://docs.scipy.org/doc/scipy/tutorial/optimize.html) e [Google OR-Tools](https://developers.google.com/optimization/introduction) — implementação de modelos numéricos e de otimização; não substituem o programa teórico completo de Investigação Operacional.

Vídeos do **canal oficial MIT OpenCourseWare**:

1. [18.06 — The Geometry of Linear Equations (Gilbert Strang)](https://www.youtube.com/watch?v=J7DzL2_Na80), publicado no YouTube em 2019, associado às UCs de Álgebra Linear e Matrizes.
2. [Laplace Transform: First Order Equation (Gilbert Strang)](https://www.youtube.com/watch?v=9RJml41PFnc), publicado no YouTube em 2016, associado a Equações Diferenciais e UCs de sistemas dinâmicos.

Os vídeos foram selecionados por **título, descrição e canal oficiais**. `full_video_reviewed=false`: não houve visualização ou auditoria pedagógica integral das aulas.

### Engenharia Eletrotécnica e Informática Embebida

- [All About Circuits — Livro de Eletricidade e Eletrónica](https://www.allaboutcircuits.com/textbook/) — circuitos, medição, eletrónica e semicondutores, em 9 UCs com pertinência direta.
- [All About Circuits — Eletrónica Digital](https://www.allaboutcircuits.com/textbook/digi/) — álgebra booleana e circuitos digitais, em Sistemas Digitais, Microprocessadores e Computação Reconfigurável.
- [Arduino Learn](https://docs.arduino.cc/learn/) — recurso já catalogado, reutilizado para Computação Física, Microprocessadores e Domótica.
- [MIT 6.002 — Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/) — corrigida a URL canónica do recurso da ronda anterior.

As fontes complementam a aprendizagem técnica, mas **não** representam as normas portuguesas para instalações elétricas, certificações profissionais ou instruções de segurança de equipamentos específicos.

### Bioquímica e Ciências Biomédicas

- [EMBL-EBI — Genómica Funcional II](https://www.ebi.ac.uk/training/online/courses/functional-genomics-ii-common-technologies-and-data-analysis-methods/), [Introdução à Proteómica](https://www.ebi.ac.uk/training/online/courses/proteomics-an-introduction/) e [Métodos e Recursos Ómicos](https://www.ebi.ac.uk/training/online/courses/methods-and-resources-for-omics-studies/) — fontes aplicadas a UCs de Genómica, Bioquímica Analítica, Proteómica, Lipidómica e doença metabólica.
- [OpenStax — Microbiology](https://openstax.org/books/microbiology/pages/1-introduction) e [Anatomy and Physiology 2e](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction) — fundamentos de microbiologia e sistemas orgânicos.
- [OMS — Laboratory Biosafety Manual, 4th edition](https://www.who.int/publications/i/item/9789240011311) — princípios de segurança e avaliação de risco em laboratório; cumprir as normas locais e a supervisão do laboratório.
- [UNESCO — Universal Declaration on Bioethics and Human Rights](https://www.unesco.org/en/legal-affairs/universal-declaration-bioethics-and-human-rights) — enquadramento ético e de direitos humanos para Bioética.
- [University of Utah — Learn.Genetics](https://learn.genetics.utah.edu/content/basics/) — materiais de genética introdutória.
- [NCBI Bookshelf — Immunobiology, 5th edition](https://www.ncbi.nlm.nih.gov/books/NBK10757/) — **obra histórica de 2001**; conceitos modernos e aplicações clínicas devem ser confrontados com fontes atuais.
- [ATCC — Animal Cell Culture Guide](https://www.atcc.org/resources/culture-guides/animal-cell-culture-guide) e [EMA — Advanced Therapy Medicinal Products](https://www.ema.europa.eu/en/human-regulatory-overview/advanced-therapy-medicinal-products-overview) — cultura de células, terapias génicas e celulares; material informativo, não aconselhamento clínico nem protocolo laboratorial substitutivo.

### Modelação Digital, Construção e SIG

- [QGIS 3.44 — User Guide](https://docs.qgis.org/3.44/en/docs/user_manual/) e [Training Manual](https://docs.qgis.org/3.44/en/docs/training_manual/index.html) — cartografia, georreferenciação e sistemas de informação geográfica.
- [Autodesk Revit 2026 — Revit Fundamentals](https://help.autodesk.com/cloudhelp/2026/ENU/Revit-GetStarted/files/GUID-03565843-BB48-4707-B54C-39D6E8E51880.htm) — BIM aplicado a edifícios, arquitetura e estruturas.
- [Blender — Modeling Meshes](https://docs.blender.org/manual/en/latest/modeling/meshes/introduction.html) e [Animation & Rigging](https://docs.blender.org/manual/en/latest/animation/) — modelação e animação 3D.
- [SketchUp — Creating a 3D Model](https://help.sketchup.com/en/sketchup/creating-3d-model) — operações geométricas e formas tridimensionais.
- [OpenStax — Static Equilibrium](https://openstax.org/books/university-physics-volume-1/pages/12-introduction) — fundamentos mecânicos para Estática e Resistência dos Materiais, sem substituir projeto de estruturas.

Software de modelação pode exigir licenças ou contas; os tutoriais são gratuitos para leitura mas não pressupõem que o software seja disponibilizado pela FACODI.

### Controlo de qualidade e limites

- Todos os mapeamentos novos foram validados por **código de UC existente no curso exato** antes da escrita.
- A verificação de URL confirmou as páginas públicas principais, não todos os ficheiros ou aulas embebidos nelas.
- Não foi reconstruída a ementa oficial de qualquer UC nem marcada como verificada uma FUC de 2026/27.
- O catálogo contém uma **duplicação antiga**, anterior a este lote, do recurso `https://learnenglish.britishcouncil.org/free-resources/writing` em dois objetos de fontes históricas diferentes. Foi identificada, **mas não alterada** nesta intervenção para não afetar relações já existentes sem auditoria de dependências. Nenhuma das fontes adicionadas criou essa duplicação.
- O teste de leitura pública foi realizado por consulta SQL com role `anon`. A revisão visual ponta a ponta em `facodi.com` e a visualização integral dos vídeos continuam pendentes.
- Não criar módulos ou sequências de reprodução arbitrárias para compensar falta de FUC ou revisão de aulas. Próximas decisões de enriquecimento devem partir de recursos de alta adequação curricular, com autoria e direitos preservados.

---

## Sexta ronda — cobertura editorial de UCs sem referências (2026-11-20)

**Objetivo:** reduzir lacunas reais de bibliografia complementar nos seis cursos já enriquecidos, sem preencher projetos, estágios ou opções com materiais arbitrários.

**Lotes publicados diretamente no Supabase `facodi`:**
- `facodi_cross_course_followup_20261120_v6_tech_econ`;
- `facodi_cross_course_followup_20261120_v6_science`;
- `facodi_cross_course_followup_20261120_v6_specifics`.

### Resultado validado

- **45 novos `external_resource`**, com autor, descrição, ligação pública para a fonte e metadados de revisão;
- **98 novas relações `contains`**, correspondentes a **88 UCs distintas** dos seis cursos;
- **101 UCs sem uma referência documental no início** desta ronda, **14 após a intervenção**;
- Consulta transacional com `SET LOCAL ROLE anon`: **45 fontes e 98 relações visíveis**;
- Integridade: **0 child objects indisponíveis, 0 parent objects indisponíveis, 0 relações com escopo de leitura inadequado**;
- Nenhum código de UC, curso, ECTS, estado de publicação, tabela ou política RLS alterado.

| Curso | Total UCs | UCs sem refs antes | Depois | UCs enriquecidas | Novos vínculos |
|---|---:|---:|---:|---:|---:|
| `engenharia-eletrotecnica-computadores` | 55 | 27 | 6 | 21 | 27 |
| `engenharia-civil` | 39 | 24 | 1 | 24 | 28 |
| `matematica-aplicada-economia-gestao` | 31 | 18 | 1 | 17 | 17 |
| `bioquimica` | 44 | 16 | 1 | 15 | 15 |
| `ciencias-biomedicas` | 40 | 8 | 1 | 7 | 7 |
| `ctesp-desenho-modelacao-digital` | 19 | 8 | 4 | 4 | 4 |
| **Total** | **228** | **101** | **14** | **88** | **98** |

As 88 UCs enriquecidas não equivalem a 88 UCs antes vazias: **87 UCs passaram a ter uma primeira referência**, e uma UC que já tinha fontes recebeu conteúdo complementar adicional.

### Aprendizagem transversal por áreas

- **Engenharia Eletrotécnica:** MIT (Algoritmos, Sinais, Telecomunicações, Eletromagnetismo e Sistemas Operativos), PostgreSQL, Godot, Física, IEA 2026 (energia renovável), Siemens SITRAIN, Odoo 19 Studio, Diário da República (RTIEBT). As fontes legais e regulamentares devem ser verificadas quanto à sua redação atual e Anexos Nacionais quando aplicável; formação comercial não é apresentada como gratuita.
- **Engenharia Civil:** MIT (Estruturas, Solos, Fluidos), OpenStax, EU-OSHA, UN-Habitat, Eurocode 2/JRC, Comissão Europeia (produtos de construção e segurança rodoviária), USGS, LNEC, APM e Portal da Habitação. Materiais não substituem projetos habilitados, normas completas ou legislação portuguesa em vigor.
- **Matemática Aplicada à Economia e à Gestão:** OpenStax (Economia, Finanças, Gestão e Contabilidade), statsmodels (OLS), MIT (Probabilidade, sistemas dinâmicos), Banco Central Europeu e SNC da CNC. Notas sobre diferença entre regras contabilísticas internacionais e portuguesas preservadas nos objetos.
- **Bioquímica:** Bioenergética/Enzimologia, química física, higiene alimentar FAO, gestão laboratorial OMS, mecanismos de toxicologia NIEHS, métodos de separação MIT, microbiologia e sistema nervoso OpenStax, biotecnologia vegetal introdutória e EPA (biorremediação).
- **Ciências Biomédicas:** curso de Epidemiologia do CDC, artigos NCBI sobre Histologia e Farmacodinâmica, princípios 3Rs da NC3Rs e fundamentos de neuroanatomia da OpenStax; os recursos não têm função de aconselhamento médico ou protocolização clínica.
- **CTeSP Desenho e Modelação Digital:** tutoriais Autodesk AutoCAD, mapas de quantidades Revit, QGIS (inventariação por atributos), UN-Habitat (infraestruturas urbanas).

### Fontes publicadas nesta ronda

#### Engenharia, economia e desenho

| Referência original | Autor | Idioma indicado |
|---|---|---|
| [Agência Internacional da Energia — Renewables 2026](https://www.iea.org/reports/renewables-2026) | International Energy Agency | `en` |
| [Autodesk — Tutoriais de desenho e cotagem no AutoCAD](https://www.autodesk.com/solutions/aec/autocad-tutorials) | Autodesk | `en` |
| [Autodesk Revit — Schedules, Quantities and Material Takeoffs](https://help.autodesk.com/cloudhelp/2026/ENU/Revit-DocumentPresent/files/GUID-F50D6FF4-859E-43A2-A2F6-81C84A1BA0EB.htm) | Autodesk | `en` |
| [Banco Central Europeu — Política Monetária](https://www.ecb.europa.eu/mopo/intro/html/index.pt.html) | Banco Central Europeu | `pt` |
| [Comissão de Normalização Contabilística — SNC](https://www.cnc.min-financas.pt/snc.html) | Comissão de Normalização Contabilística / Portugal | `pt` |
| [EU-OSHA — Construction Safety: Risks and Prevention](https://oshwiki.osha.europa.eu/en/themes/construction-safety-risks-and-prevention) | Agência Europeia para a Segurança e Saúde no Trabalho | `en` |
| [Godot Engine — Your First 2D Game](https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html) | Godot Engine | `en` |
| [MIT OCW — Probabilistic Systems Analysis (6.041SC)](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Advanced Soil Mechanics](https://ocw.mit.edu/courses/1-361-advanced-soil-mechanics-fall-2004/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Digital Communication Systems (6.02)](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Electromagnetics and Applications (6.013)](https://ocw.mit.edu/courses/6-013-electromagnetics-and-applications-fall-2005/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Engineering Mechanics II (Fluidos)](https://ocw.mit.edu/courses/1-060-engineering-mechanics-ii-spring-2006/pages/syllabus/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Operating System Engineering (6.828)](https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Signals and Systems (6.003)](https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/) | MIT OpenCourseWare | `en` |
| [MIT OpenCourseWare — Solid Mechanics (1.050)](https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/) | MIT OpenCourseWare | `en` |
| [ONU-Habitat — Soluções baseadas na Natureza no Planeamento Urbano](https://unhabitat.org/knowledge/publications/integrating-nature-based-solutions-into-urban-territorial-planning-building-biodiverse-resilient) | UN-Habitat | `en` |
| [OpenStax — Física dos Fluidos, capítulo 14](https://openstax.org/books/university-physics-volume-1/pages/14-introduction) | OpenStax | `en` |
| [OpenStax — Principles of Finance](https://openstax.org/books/principles-finance/pages/1-why-it-matters) | OpenStax / Rice University | `en` |
| [OpenStax — Principles of Managerial Accounting](https://openstax.org/books/principles-managerial-accounting/pages/1-why-it-matters) | OpenStax / Rice University | `en` |
| [OpenStax — University Physics Vol. 2 (eletromagnetismo e termodinâmica)](https://openstax.org/books/university-physics-volume-2/pages/1-introduction) | OpenStax / Rice University | `en` |
| [Portal da Habitação — Reabilitação Urbana](https://www.portaldahabitacao.pt/reabilitacao_urbana) | Instituto da Habitação e da Reabilitação Urbana | `en` |
| [QGIS — Tabelas de Atributos e Inventariação Digital](https://docs.qgis.org/3.44/en/docs/user_manual/working_with_vector/attribute_table.html) | QGIS Documentation Team | `en` |
| [statsmodels — Exemplo de Regressão por Mínimos Quadrados](https://www.statsmodels.org/stable/examples/notebooks/generated/ols.html) | statsmodels | `en` |

#### Bioquímica e Ciências Biomédicas

| Referência original | Autor | Idioma indicado |
|---|---|---|
| [CDC Public Health 101 — Introduction to Epidemiology](https://www.cdc.gov/training-publichealth101/php/training/introduction-to-epidemiology.html) | Centers for Disease Control and Prevention | `en` |
| [FAO — Boas Práticas de Higiene Alimentar e HACCP](https://www.fao.org/good-hygiene-practices-haccp-toolbox/ghp/introduction-to-ghp/) | FAO / Codex Alimentarius | `en` |
| [MIT OpenCourseWare — Separation Processes (10.32)](https://ocw.mit.edu/courses/10-32-separation-processes-spring-2005/) | MIT OpenCourseWare | `en` |
| [NC3Rs — Princípios dos 3Rs em Investigação Animal](https://nc3rs.org.uk/who-we-are/3rs) | NC3Rs (United Kingdom) | `en` |
| [NCBI Bookshelf — Histology, Staining](https://www.ncbi.nlm.nih.gov/books/NBK557663/) | NCBI Bookshelf / StatPearls | `en` |
| [NCBI Bookshelf — Pharmacodynamics](https://www.ncbi.nlm.nih.gov/books/NBK507791/) | NCBI Bookshelf / StatPearls | `en` |
| [NIEHS — Introdução à Toxicologia Ambiental](https://www.niehs.nih.gov/health/topics/science/toxicology) | National Institute of Environmental Health Sciences (NIH) | `en` |
| [OMS — Laboratory Quality Management System Handbook](https://www.who.int/publications-detail-redirect/9789241548274) | Organização Mundial da Saúde | `en` |
| [OpenStax Anatomy & Physiology 2e — Introdução ao Sistema Nervoso](https://openstax.org/books/anatomy-and-physiology-2e/pages/12-introduction) | OpenStax / Rice University | `en` |
| [OpenStax Biology 2e — Energia, Metabolismo e Enzimas](https://openstax.org/books/biology-2e/pages/6-introduction) | OpenStax / Rice University | `en` |
| [OpenStax Biology 2e — Fotossíntese e Energia Vegetal](https://openstax.org/books/biology-2e/pages/8-introduction) | OpenStax / Rice University | `en` |
| [OpenStax Chemistry 2e — Termodinâmica e Energia Livre](https://openstax.org/books/chemistry-2e/pages/16-introduction) | OpenStax / Rice University | `en` |

#### Fontes técnicas e legislação específica

| Referência original | Autor | Idioma indicado |
|---|---|---|
| [Association for Project Management — O que é gestão de projetos?](https://www.apm.org.uk/resources/what-is-project-management/) | Association for Project Management | `en` |
| [Comissão Europeia — Regulamento de Produtos de Construção](https://single-market-economy.ec.europa.eu/sectors/construction/construction-products-regulation-cpr/cpr-overview_en) | Comissão Europeia | `en` |
| [Comissão Europeia — Segurança e Avaliação de Infraestruturas Rodoviárias](https://road-safety.transport.ec.europa.eu/eu-road-safety-policy/priorities/infrastructure/road-infrastructure-guidelines_en) | Comissão Europeia / Road Safety | `en` |
| [Diário da República — Regras Técnicas Instalações Elétricas de Baixa Tensão](https://diariodarepublica.pt/dr/detalhe/portaria/949-a-2006-303262) | Diário da República / Portugal | `pt` |
| [EPA — Tecnologias de Biorremediação Ambiental](https://www.epa.gov/remedytech/remediation-technology-descriptions-cleaning-contaminated-sites) | US Environmental Protection Agency | `en` |
| [Eurocodes / JRC — Eurocódigo 2, Estruturas de Betão](https://eurocodes.jrc.ec.europa.eu/EN-Eurocodes/eurocode-2-design-concrete-structures) | Joint Research Centre / Comissão Europeia | `en` |
| [LNEC — Documentos de Homologação de Produtos e Sistemas](https://www.lnec.pt/services/produtos-e-sistemas-de-construcao/dh) | Laboratório Nacional de Engenharia Civil | `pt` |
| [Odoo 19 — Documentação do Studio (Low-Code)](https://www.odoo.com/documentation/19.0/applications/studio.html) | Odoo S.A. | `en` |
| [Siemens SITRAIN — Formação SIMATIC e TIA Portal](https://www.siemens.com/pt-pt/training/sitrain/simatic-training/) | Siemens | `pt` |
| [USGS — Geological Framework Mapping](https://www.usgs.gov/special-topics/earth-mri/geologic-framework-mapping) | U.S. Geological Survey | `en` |

### Verificação das permissões de leitura

A **primeira execução** dos lotes técnico-económico e científico usou o valor `review_scope='original_public_landing_page'` e criou vínculos que não eram visíveis pela role `anon`. A auditoria às políticas existentes demonstrou que a política `facodi_public_external_reading_relations` exige exatamente:
- `relation_type='contains'`;
- `created_by_mechanism='verified_external_reading_curation'`;
- `metadata.review_status='approved'`;
- `metadata.review_scope='external_landing_page'`;
- objetos parent `curricular_unit` e child `external_resource`, ambos publicados em estado permitido.

Os **84 vínculos dos primeiros dois lotes** foram corrigidos **apenas nos seus metadados**, preservando `review_scope_detail='original_public_landing_page'` e registando a normalização de contrato. O terceiro lote foi gravado desde o início com o valor correto. A validação final confirmou **98 relações acessíveis a visitantes**, sem criar, remover ou alargar políticas RLS. Esta é uma regra de publicação a respeitar nas curadorias futuras.

### Deliberadamente não preenchido

Restam 14 UCs sem referência específica, todas com escopo ainda dependente de orientação académica, incluindo:
- Projeto em Bioquímica e Projeto em Ciências Biomédicas;
- Projeto I/II/III e Estágio do CTeSP em Desenho e Modelação Digital;
- uma UC `Outra (definida anualmente pela UO)` em Engenharia Civil;
- Projetos/Estágios por especialidade CI/EA/EE em Engenharia Eletrotécnica;
- `Opção a Escolher por Requerimento na UALGNET` em Matemática Aplicada.

**Próxima ação pertinente:** obter tema/brief de cada projeto e os regulamentos de estágio aplicáveis, e só então ligar os recursos específicos. Não confundir cobertura quantitativa com equivalência às FUC.

### Limitações e auditoria

- As URLs destinam-se às páginas públicas de autores e instituições. Os recursos e os capítulos internos **não foram revistos integralmente**.
- O conteúdo pode estar em inglês, exigir uma conta, licença de software ou acesso a normas técnicas de pagamento. A ausência de paywall não foi garantida.
- Nenhum vídeo novo foi registado nesta sexta ronda, nem foi construída uma sequência com vídeos não revistos.
- O frontend React, schema Supabase, autenticação, RLS e paleta HSL do FACODI **não foram modificados**.
- O teste SQL com `anon` valida a visibilidade dos dados, **não** substitui uma inspeção visual completa de cada rota em `facodi.com`.
