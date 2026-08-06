# LCM Aquino Curriculum Audit

Source: `https://www.youtube.com/@LCMAquino/playlists`
Curriculum: `https://www.ualg.pt/curso/1941/plano`
Date: 2026-08-06

## Official UAlg units used

- Análise Matemática I, `19411002`, 5 ECTS.
- Álgebra Linear e Geometria Analítica, `19411003`, 5 ECTS.
- Análise Matemática II, `19411008`, 7 ECTS.

## Playlist mapping

Thirty public playlists were discovered. The reusable map is stored in `imports/lcmaquino-playlist-map-2026-08-06.json`.

High-confidence examples:

- `Integral - Exercício de Cálculo` -> Análise Matemática I: one-variable integration.
- `Derivada - Exercício de Cálculo` -> Análise Matemática I: one-variable differentiation.
- `Limite - Exercício de Cálculo` -> Análise Matemática I: limits.
- `Produto Interno - Módulo VII - Álgebra Linear` -> Álgebra Linear e Geometria Analítica.
- `Matriz Inversa e Determinante` -> Álgebra Linear e Geometria Analítica.
- `Exercícios de Geometria Analítica` -> Álgebra Linear e Geometria Analítica.
- Double integrals, partial derivatives, and polar-coordinate playlists -> Análise Matemática II.

Low/medium-confidence playlists such as EDP, EDO, vector functions, sequences/series, and pre-calculus require human curricular confirmation. Git, LaTeX, video production, lectures, and other non-mathematical playlists are not mapped to a LESTI mathematics UC.

## Pilot outcome

The existing Geometria Analítica playlist pilot has five proposals, all enriched by Gemini and awaiting review. They remain outside the Análise Matemática I collection. No eLearning slide was created by the manifest import.

## Reusable importer

`imports/import_channel_manifest.py` accepts a source-neutral manifest, computes a playlist+canonical-URL fingerprint, reuses existing proposals, and never creates eLearning content. Classification remains manifest data plus human review.
