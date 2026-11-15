# FACODI — módulos de estudo e grafo interdisciplinar

**Data:** 15 de novembro de 2026  
**Projeto:** Supabase `wvkjainfwsyiyfcmbtid`  
**Schema:** `facodi`  
**Frontend:** [facodi.com](https://facodi.com) — Cloudflare  
**Branch versionada:** [Open2Tech/facodi: facodi](https://github.com/Open2Tech/facodi/tree/facodi)

## Decisão de arquitetura

Os materiais existentes passam a ser reutilizados por uma camada editorial de **módulos de estudo**. O mesmo vídeo YouTube, documento ou sequência de aulas pode apoiar diferentes UCs e cursos sem uma nova cópia do recurso.

Estrutura:

```text
Curso (facodi.courses)
 └─ Unidade curricular (facodi.curricular_units)
     ├─ Module (facodi.learning_objects: module)
     │   ├─ Sequência de vídeos (playlist) → vídeos originais no YouTube
     │   └─ Referência externa / documento
     ├─ Sequências e documentos já existentes (mantidos)
     └─ Vídeos individuais já ligados (mantidos)

Módulo A —prerequisite_of→ Módulo B
Módulo C —correlates_with→ Módulo D
```

* `contains`: objeto filho na ordem editorial, disponível com a RLS pública já existente.
* `prerequisite_of`: **fundamento conceptual sugerido**, não exigência formal de matrícula ou avaliação.
* `correlates_with`: ligação interdisciplinar opcional, **não** pré-requisito.
* O módulo é um objeto pedagógico autónomo que **não substitui** a unidade curricular, o curso nem a origem dos vídeos.

## Conteúdo criado

Foram publicados **25 módulos**, classificados em onze grupos pedagógicos, partilhando **46 sequências** e **30 leituras/documentos** já existentes:

| Área | Módulos | Temas |
| --- | ---: | --- |
| Física | 3 | Movimento e vetores; calor e termodinâmica; eletricidade, magnetismo e ondas |
| Astronomia | 2 | Observação e instrumentos; ondas gravitacionais e astrobiologia |
| Álgebra Linear | 2 | Matrizes e sistemas; espaços e transformações |
| Análise Matemática I | 2 | Funções, limites e continuidade; derivação e integração |
| Análise Matemática II | 2 | Funções multivariáveis e gradiente; integrais duplas |
| Estatística | 2 | Probabilidade e distribuições; inferência e regressão |
| Bases de Dados | 3 | Modelo relacional e SQL; transações; manutenção e backups |
| Desenvolvimento colaborativo | 2 | Git e revisão; testes e CI/CD |
| Tipografia | 2 | Legibilidade e composição; sistemas editoriais |
| Química | 3 | Ligações; gases e termoquímica; cinética e equilíbrio |
| Biologia | 2 | Genética e hereditariedade; evolução e ecologia |
| **Total** | **25** | **Sequências e materiais do catálogo já publicado** |

Há **33 relações módulos→UC** distribuídas entre **22 UCs distintas** em cinco cursos:

| Curso | UCs com os novos módulos |
| --- | ---: |
| LESTI | 8 |
| CTeSP STI | 3 |
| Técnico em Administração — Ifes Cariacica | 7 |
| Licenciatura em Design de Comunicação | 2 |
| Astronomia e Astrofísica — percurso editorial FACODI/GACS | 2 |

**Importante:** cursos diferentes podem partilhar um módulo sem unificar ou equiparar formalmente os seus planos curriculares. As 33 ligações incluem módulos associados a mais de uma UC, por exemplo Bases de Dados da LESTI/CTeSP.

## Sequenciamento e recomendações

Foram criadas **13 relações `prerequisite_of`** entre módulos com progressão conceptual fundamentada, por exemplo:
- Funções e limites → derivadas e integração;
- Derivadas e integração → funções multivariáveis → integrais duplas;
- Modelo relacional → transações → manutenção de bases de dados;
- Git e revisão → testes e CI/CD;
- Matrizes e sistemas → espaços e transformações;
- Estatística descritiva e probabilidade → inferência;
- Vetores e movimento → termodinâmica ou eletricidade/ondas;
- Tipografia I → Tipografia II.

Também foram criadas **9 relações `correlates_with`**, com justificação guardada em `metadata.rationale`, incluindo:
- Vetores (Álgebra Linear) ↔ movimento (Física);
- Vetores ↔ gradiente multivariável;
- Derivadas ↔ interpretação de movimento;
- Ondas/luz ↔ observação astronómica;
- Termodinâmica em Física ↔ Química;
- Ligações químicas ↔ biologia molecular;
- Estatística ↔ ecologia;
- Organização de dados ↔ análise estatística;
- Genética ↔ introdução à astrobiologia.

As relações não se intitulam certificações, equivalências ou reconhecimento institucional. As conexões curriculares continuam independentes.

## Frontend e idiomas

O detalhe público de **module** em `/resources/:slug` passa a incluir:

1. **Sequências de vídeo** — links ordenados para `/sequences/:slug`.
2. **Leituras e materiais complementares** — documentos e `external_resource`, mantendo as respetivas origens.
3. **Como continuar a estudar** — módulos de base, próximos módulos e áreas relacionadas.

A implementação usa `useLinkedCatalogAssets` e `useModuleProgression`, com TanStack Query, Supabase Data API e RLS como camada de autorização. As traduções foram incluídas em português, inglês, espanhol e francês. O material pedagógico de outras instituições é identificado como complementar e não homologado.

## Segurança e integridade

- Nenhuma tabela `public.videos` foi modificada nesta etapa, nem foram duplicados vídeos ou documentos.
- Nenhuma inscrição, progresso, pontuação, exercício gerado ou submissão de utilizador foi criada.
- Os dois tipos de nova ligação semântica foram expostos apenas por políticas **SELECT para `anon` e `authenticated`** com condições restritas: objetos `module` publicados, ativos, `review_status=approved` e mecanismos editoriais conhecidos.
- A política `contains` pré-existente foi preservada; as novas ligações de módulos→sequências/documentos/UC usam `structured_catalog_import`.
- Não há `SECURITY DEFINER` novo, nem novas permissões para escrita.
- IDs determinísticos, `ON CONFLICT`, contagens e checagens de existência de todos os objetos de destino impediram duplicação acidental.

### Verificações SQL concluídas

| Validação | Resultado |
| --- | ---: |
| Módulos públicos totais | **67** (42 anteriores + 25 novos) |
| Novos módulos públicos para papel `anon` | **25** |
| Relações dos módulos a sequências/documentos, visíveis a `anon` | **76** |
| Relações módulos–UC | **33** |
| Pré-requisitos conceptuais visíveis a `anon` | **13** |
| Relações interdisciplinares visíveis a `anon` | **9** |
| Ligações órfãs | **0** |
| Relações duplicadas | **0** |
| Ligações semânticas para módulos privados | **0** |
| Vídeos em rascunho visíveis a `anon` | **0** |
| Classificações privadas visíveis a `anon` | **0** |
| Vídeos anteriormente publicados | **893** (inalterado) |

O teste foi executado em transação com `SET LOCAL ROLE anon`, sem conceder privilégios adicionais.

### Verificações reais em Cloudflare

**[Módulo Física: grandezas, vetores e movimento](https://facodi.com/resources/facodi-modulo-20261115-physics-motion)**: página sem login, 3 sequências visíveis, uma referência OpenStax e links de continuação para Termodinâmica e Eletricidade.

**[Módulo Álgebra: espaços e transformações](https://facodi.com/resources/facodi-modulo-20261115-algebra-vectors)**: página sem login, sequência de Álgebra, guia complementar, pré-requisito Matrizes e links de áreas relacionadas para Física e Análise II. A ligação para Física foi aberta com sucesso, sem erro visual nem pedido de autenticação.

Esses testes confirmam navegação e exposição dos recursos, **não** validação de reprodução de todos os vídeos ou revisão integral dos seus conteúdos. Não se utilizou Vercel.

## Migrações versionadas

- `20261115211503_facodi_20261115_25_interdisciplinary_video_study_modules_and_prerequisites.sql`
- `20261115211556_facodi_20261115_public_rls_curated_module_prerequisite_edges.sql`
- `20261115212110_facodi_20261115_9_reviewed_cross_discipline_module_links.sql`

## Próximas revisões editoriais possíveis

A iniciativa permanece **content-first**: enriquecer sequências e leituras que já existem, mapear os módulos às UCs ainda sem cobertura, examinar a qualidade da legenda e o estado de reprodução das fontes originais. Evitar construir exercícios artificiais, publicar transcrições automáticas sem revisão, ou sugerir que os materiais possuem acreditação académica.
