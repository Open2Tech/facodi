# FACODI — data de publicação dos vídeos no YouTube (18/11/2026)

## Para quê

O `VideoObject` (JSON-LD) de cada vídeo usa `metadata.published_date_on_youtube` como `uploadDate` (PR #97). Antes deste lote, só 7 dos 970 vídeos tinham essa data.

## Fonte e método

- **Lista:** vídeos públicos da FACODI (`learning_objects`, `object_type = video`) sem data: 963.
- **Data:** lida na página pública de cada vídeo no YouTube (`<meta itemprop="uploadDate">`), sem chave de API.
- **Ritmo:** 2 pedidos em paralelo, com 500 ms de intervalo.
- **Resultado:**
  - 380 vídeos com data confirmada;
  - 583 sem data. O YouTube passou a responder **429 (demasiados pedidos)** a partir do vídeo 381. Não forcei o limite: esses vídeos estão em `not_found` no manifesto, com o estado HTTP.

## Datas por ano (380)

| Ano | Vídeos |
|---|---|
| 2014 | 7 |
| 2017 | 9 |
| 2018 | 11 |
| 2019 | 33 |
| 2020 | 43 |
| 2021 | 76 |
| 2022 | 59 |
| 2023 | 13 |
| 2024 | 20 |
| 2025 | 51 |
| 2026 | 58 |

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72): https://github.com/guguscheidt/facodi/blob/scripts/facodi_video_upload_dates_20261118/supabase/seeds/facodi_video_upload_dates_20261118.sql

- **O que muda:** só preenche `published_date_on_youtube`, e só quando está vazio. Os 7 vídeos que já tinham data não mudam.
- **Proteção:** só atualiza quando o ID do YouTube guardado no vídeo é o mesmo que foi lido.
- **Origem:** grava também `published_date_source = youtube_watch_page_2026-11-18`.
- **Idempotente:** uma segunda execução atualiza 0 linhas.

## Verificação (PostgreSQL 17 local)

| Caso | Resultado |
|---|---|
| 1.ª execução sobre os 380 vídeos | 378 atualizados |
| 2.ª execução | 0 atualizados |
| Vídeo que já tinha data | não muda |
| Vídeo com ID do YouTube diferente | ignorado |

Os 2 vídeos que faltam para os 380 são os dois casos de proteção, de propósito.

## Os 583 que faltam

Há duas formas de os completar:

- correr outra vez a recolha mais tarde, devagar; ela retoma onde parou;
- usar a **YouTube Data API** (`videos.list`, `part=snippet`, 50 IDs por pedido, cerca de 12 pedidos), que precisa de uma chave do projeto.

Gero o segundo lote no mesmo formato.
