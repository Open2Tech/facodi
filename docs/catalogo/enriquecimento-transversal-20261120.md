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
