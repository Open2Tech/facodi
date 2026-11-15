# FACODI — Oportunidades de vídeos existentes no schema `public`

**Auditoria de leitura:** 15 de novembro de 2026  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid`  
**Schemas comparados:** `public.videos` ↔ `facodi.youtube_videos`  
**Inventário detalhado:** [178 vídeos ainda por considerar](audits/facodi-public-video-gap-2026-11-15.csv)  
**Estado:** **proposta editorial**. Esta auditoria **não importou, aprovou ou publicou** novos vídeos.

## 1. Estado real e metodologia

| Métrica | Resultado |
| --- | ---: |
| Vídeos em `public.videos` | **795** |
| IDs YouTube únicos no Tube | **795** |
| IDs em `facodi.youtube_videos` | **900** |
| IDs existentes nos dois schemas | **617** |
| IDs apenas no Tube, ainda sem registo FACODI | **178** |
| IDs apenas na FACODI, provenientes de outras fontes/curadorias | **283** |
| Vídeos públicos FACODI (`learning_objects` de tipo `video`) | **893** |
| Vídeos oficiais Odoo no Tube, por `channel_name='Odoo'` | **72** |
| Oficiais Odoo do Tube já em FACODI | **41** |
| Oficiais Odoo ainda ausentes | **31** |

O critério de diferença é **`public.videos.youtube_id = facodi.youtube_videos.youtube_video_id`**. O mesmo vídeo partilhado por várias UCs ou sequências conta **uma vez**. Uma verificação adicional por `learning_objects.source_url` não encontrou URL com ID equivalente nos itens ausentes.

### Qualidade do lote de 178 vídeos ainda ausentes

- **161** não têm descrição no Tube.
- **45** não têm duração.
- **14** estão atribuídos ao canal-placeholder `YouTube` (podendo haver criadores identificáveis na fonte original).
- **151** têm enriquecimento de IA no Tube; isto **não garante a veracidade** dos resumos ou das tags.
- **70** constam de pelo menos uma playlist do Tube.
- Os 178 IDs têm sintaxe canónica de 11 caracteres, mas **não** se verificou em massa a disponibilidade atual de cada vídeo.
- O campo `language` é pouco fiável: vários títulos e vídeos em inglês constam como `pt` ou `und`. Corrigir a língua a partir da fonte original antes de publicar.

Os números acima refletem o estado consultado, não uma lista de vídeos automaticamente elegíveis.

## 2. Priorização editorial

Distribuição do [inventário completo](audits/facodi-public-video-gap-2026-11-15.csv): **17 P1**, **33 P2** e **128 P3**. Critérios: pertinência curricular concreta, autoridade da fonte, possibilidade de reutilizar sequências existentes e documentação mínima. A classe indica **prioridade para investigação humana**, não uma certificação/validação editorial concluída.

### P1 — 17 candidatos para o primeiro lote de curadoria

| ID YouTube | Recurso | Destino previsto | Justificação/precaução |
| --- | --- | --- | --- |
| [OZLP-SCHW7A](https://www.youtube.com/watch?v=OZLP-SCHW7A) | **Meet Odoo 19's best features** — Odoo | LGEST `14181196` e `14181197` (SIG I/II), `14181177` (Informática para Gestão) | Visão geral oficial, útil como vídeo de entrada; confirmado em documentação da própria Odoo |
| [0Uj0n0ERx6I](https://www.youtube.com/watch?v=0Uj0n0ERx6I) | Create Job Positions — Odoo | LGEST `14181094` (Gestão de Recursos Humanos); Ifes `IFESCAR-ADM26-3-GESTAO-PESSOAS` | Recrutamento e definição de vagas |
| [M8BSg8VMta4](https://www.youtube.com/watch?v=M8BSg8VMta4) | Share Jobs — Odoo | LGEST RH; Ifes Gestão de Pessoas | Divulgação de vagas, complementar ao recrutamento |
| [-xHbo21qjJI](https://www.youtube.com/watch?v=-xHbo21qjJI) | Interview Forms — Odoo | LGEST RH; Ifes Gestão de Pessoas | Entrevistas e processos de seleção |
| [WXn5il2wB0o](https://www.youtube.com/watch?v=WXn5il2wB0o) | Hire an Applicant — Odoo | LGEST RH; Ifes Gestão de Pessoas | Conclusão do recrutamento; comparar com vídeos existentes de candidatos |
| [vlVKTeokFO4](https://www.youtube.com/watch?v=vlVKTeokFO4) | Appraisals Basics — Odoo | LGEST RH | Gestão de desempenho; comparar com `Conduct Appraisals` já publicado |
| [vYyl77YzRwY](https://www.youtube.com/watch?v=vYyl77YzRwY) | Appraisal Goals — Odoo | LGEST RH | Objetivos e avaliação de desempenho |
| [q9dmuj9huFk](https://www.youtube.com/watch?v=q9dmuj9huFk) | Payroll Basics — Odoo | LGEST RH; Gestão/Contabilidade, onde aplicável | Atenção à legislação/localização fiscal de cada país |
| [qjfJXsg_zSA](https://www.youtube.com/watch?v=qjfJXsg_zSA) | Salary Configuration — Odoo | LGEST RH | Configuração técnica, não orientação jurídica/fiscal portuguesa |
| [W3K_9S3Qsj8](https://www.youtube.com/watch?v=W3K_9S3Qsj8) | Time Off Basics — Odoo | LGEST RH | Férias/ausências; distinguir parametrização do produto e regras legais |
| [MbwCZ6-H6Dw](https://www.youtube.com/watch?v=MbwCZ6-H6Dw) | Accrual Plans — Odoo | LGEST RH | Planos de aquisição de dias; distinguir Odoo de normativa laboral |
| [IMTzJoWrtU0](https://www.youtube.com/watch?v=IMTzJoWrtU0) | Overtime — Odoo | LGEST RH | Horas extraordinárias; dependente de versão e localização |
| [idf86c350U0](https://www.youtube.com/watch?v=idf86c350U0) | Offboarding — Odoo | LGEST RH; Ifes Gestão de Pessoas | Ciclo de vida do colaborador |
| [xj_GjnD4uyI](https://www.youtube.com/watch?v=xj_GjnD4uyI) | **Every Networking Concept Explained In 20 Minutes** — TechWorld with Nana | LESTI `19411014` (Redes de Computadores), CTeSP `18121014` | Conteúdo de IP, DNS, portas, redes, NAT, VPC, Docker e Kubernetes; fonte original localizada |
| [p9L7YFqHGk4](https://www.youtube.com/watch?v=p9L7YFqHGk4) | **Customize Dev Containers in VS Code with Dockerfiles and Docker Compose** — Visual Studio Code | LESTI `19411001`, CTeSP `18121017` (Ambientes de Desenvolvimento Colaborativo) | Demonstração do canal verificado do VS Code; abordagem prática com Docker |
| [SYU8tT_WqIY](https://www.youtube.com/watch?v=SYU8tT_WqIY) | Configurar ambiente Python profissional — Daxus/Empowerdata | LESTI/CTeSP Ambientes de Desenvolvimento Colaborativo e Programação | Reavaliar ferramentas e versões mostradas, por ser material de 2024 |
| [EoQFKtPz15Y](https://www.youtube.com/watch?v=EoQFKtPz15Y) | **Gerando executáveis — Live de Python #173** — Eduardo Mendes (Dunossauro) | CTeSP `18121006` (Complementos de Programação), LESTI Programação | O Tube atribui erroneamente ao canal `YouTube`; o vídeo e a wiki do autor confirmam o criador real. Aula avançada de empacotamento, Cython e PyInstaller, gravada em 2021 |

Os **12 vídeos de RH** devem ser integrados aos objetos já existentes: a UC `14181094` (LGEST) tem **25 vídeos diretos e cinco sequências**, não sendo necessário criar curso novo. A UC de Gestão de Pessoas do Ifes tem módulo existente, mas **zero vídeos diretos**. A progressão recomendada é recrutamento → avaliação → assiduidade/férias → remunerações → desligamento, combinando **vídeos já existentes** e os novos aprovados.

### P2 — 33 candidatos a inspecionar

- **18 vídeos adicionais do canal oficial Odoo:** Fleet, Frontdesk, Lunch, Expenses, referrals, benefícios e outros fluxos. É melhor distribuí-los por áreas de operações/gestão, quando o plano fizer sentido, do que carregar todos na UC de RH; muitos são específicos de funcionalidades, licenças, módulos e versões.
- **15 vídeos técnicos/educativos de outros canais** no CSV: TanStack Router (React), Directus, comparativo Portainer/EasyPanel/Coolify, Next.js Server Actions, Webhooks Odoo 18, Helpdesk Odoo 19, tema Odoo com Bootstrap, demonstração de MCP, Google Cloud AI Agents, Fireship/open source, integração Odoo WhatsApp, LeetCode, agentes na VPS, palestra de matemática/física, arquitetura de UI.
- Para os candidatos de atualidade e integração, exigir validação de versões, licença de embed, segurança, pertinência com uma UC e distinção entre **tutorial técnico**, **opinião** e **divulgação comercial**.

### P3 — 128 vídeos não recomendados para importação em massa

Inclui vídeos generalistas, entretenimento, notícias com ciclo de vida curto, clips musicais, podcasts sem aderência à ementa, itens de teste, placeholders de metadados e conteúdos com finalidade editorial distinta da FACODI. Podem continuar no Tube `public`; ausência do catálogo FACODI **não significa que devam ser apagados**.

Os dois vídeos finais de cursos THM (`K1bF6cRH0bE`, `gTwxqjQmjPU`) são apenas encerramentos sem duração/metadados suficientes. Têm baixo valor como novas aulas, apesar de serem de um canal educativo já muito presente.

## 3. Oportunidade de reutilização da playlist existente no Tube

`public.playlists` contém **86 playlists**, mas **75** permanecem com `review_status='needs_review'` e apenas **23** têm vídeos.

A playlist **Odoo Recursos Humano** é o maior conjunto estruturado encontrado:

- **95 vídeos**, com ordem na tabela `public.playlist_videos`;
- **56** vídeos já estão em `facodi.youtube_videos`;
- **39** vídeos não existem em FACODI;
- destes 39, **31** são vídeos do canal oficial Odoo e **8** são de outros criadores;
- estado do Tube: `auto_reviewed`, **não equivale** a validação pedagógica e curricular da FACODI.

**Estratégia recomendada:** manter `public.playlists` e `public.videos` intactos. Copiar apenas *referências* aos novos IDs elegíveis para `facodi.youtube_videos` e `facodi.learning_objects` após revisão. Reutilizar os vídeos já importados, compor módulos temáticos e relações `contains` com `review_status/review_scope` consistentes e sem reimportar o conjunto inteiro de 95.

## 4. Cursos com lacunas particularmente relevantes

| UC e código | Cobertura atual | Melhor oportunidade |
| --- | --- | --- |
| LESTI Redes de Computadores `19411014` | 2 vídeos diretos, 0 sequências | Aula TechWorld with Nana e organização de um módulo de Redes |
| CTeSP Redes e Protocolos Internet `18121014` | 3 vídeos diretos, 0 sequências | Reutilizar a mesma aula, com sequência de IP/DNS/portas/redes |
| LGEST Gestão de Recursos Humanos `14181094` | 25 vídeos diretos, 5 sequências | Completar recrutamento, avaliação e remunerações Odoo, mantendo contexto legal |
| Ifes Gestão de Pessoas `IFESCAR-ADM26-3-GESTAO-PESSOAS` | 0 vídeos diretos, 1 módulo | Reaproveitar 4–6 aulas introdutórias RH, com contextualização |
| LESTI Desenvolvimento de Aplicações Low-Code `19411050` | 3 vídeos diretos, 0 módulos | Vídeos Directus / Odoo / soluções low-code após verificação |
| CTeSP Sistemas Operativos `18121008` | 2 vídeos diretos | Não há ainda um vídeo P1 claramente centrado no programa; não forçar importação |
| LESTI Ambientes Colaborativos `19411001` | 30 vídeos, 2 módulos, 5 sequências | Complementar com Dev Containers e ambientes Python, não com mais um módulo genérico de Git |

A melhor ordem de enriquecimento é: **Redes (lacuna forte)**, **RH/Gestão de Pessoas (grande lote disponível)**, **Desenvolvimento colaborativo e Programação (fontes técnicas identificadas)** e **Low-Code/ERP**.

## 5. Plano técnico para uma futura importação

1. Verificar individualmente disponibilidade real no YouTube, criador/canal, título, idioma, duração, adequação e versão tecnológica. A pré-candidatura baseada no Tube **não basta**.
2. Impor `UNIQUE` lógico por `youtube_video_id` e verificar também URL canónico e referências `legacy_object_links`. **Nunca duplicar uma aula por cada curso.**
3. Inserir os novos objetos em `facodi.learning_objects`/`youtube_videos` com a **fonte original**, `metadata` de proveniência, estado editorial e revisões consistentes.
4. Associar os novos vídeos às UCs e sequências **que já existem**; criar módulo apenas onde a progressão pedagógica melhorar a navegação.
5. Tratar automaticamente como **pendente de revisão** qualquer vídeo sem dados de fonte suficientes. Não importar `public.ai_enrichments` como resumos académicos verificados.
6. Uma vez aprovado, publicar apenas links/embeds dos vídeos originais, sem alojar cópias nem alegar acreditação institucional, e verificar em `facodi.com` via Cloudflare.
7. Cobrir as alterações com testes para `anon`, RLS, ausência de órfãos/duplicados, ordem editorial e preservação de progresso.

## 6. Fontes complementares verificadas

- Odoo: [referência oficial de recursos Odoo 19](https://www.odoo.com/sl_SI/forum/pomoc-1/what-resources-are-available-to-learn-about-the-new-features-in-odoo-19-290869), incluindo vídeo `OZLP-SCHW7A`.
- TechWorld with Nana: [vídeo de redes](https://www.youtube.com/watch?v=xj_GjnD4uyI), confirmado com descrição detalhada.
- Visual Studio Code: [Dev Containers, Dockerfile e Compose](https://www.youtube.com/watch?v=p9L7YFqHGk4), confirmado no canal verificado do VS Code.
- Eduardo Mendes: [Live de Python #173](https://www.youtube.com/watch?v=EoQFKtPz15Y) e [índice da Live de Python](https://wiki.dunossauro.com/lives/), confirmando autoria e assunto.
- TanStack Router: [vídeo de Austin Davis](https://www.youtube.com/watch?v=Ab01W6h4Giw), confirmado com roteiro; candidato P2 por ser um tópico de framework e não fundamento curricular.

**Nota de governança:** este relatório e o CSV são evidência de **investigação**. Não representam publicação, recomendação oficial da UAlg/Ifes ou validação integral de todos os vídeos. Nenhuma linha dos schemas `public` ou `facodi` foi modificada nesta auditoria.
