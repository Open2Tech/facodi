# FACODI — piloto de um único percurso: Estatística do 1.º ano

**Decisão (16/11/2026).** A unidade `IFESCAR-ADM26-1-ESTATISTICA` do curso `IFES-CAR-ADM-INT-2026` apresenta **um percurso principal de 13 vídeos em três secções**. Não são criados três módulos, outra playlist, cópias de vídeos nem um novo sistema de progresso.

## Fontes de verdade e limites

- Curso e unidade curricular continuam em `facodi.courses` / `facodi.curricular_units`.
- A playlist `facodi-playlist-ifes-adm26-estatistica-descritiva` continua a possuir a ordem e os vídeos.
- A tabela existente `editorial_playlist_progress` continua a guardar o progresso por playlist e vídeo. O botão **Continuar** abre `/sequences/:slug?v=:videoId`.
- O objeto existente `ifes-adm26-estudo-1-estatistica` continua a servir de **guia e atividade prática**, sem produzir uma segunda lista de aulas na página da unidade.
- As outras duas sequências (Planilhas e ENEM) e o vídeo avulso sobre a lei de Zipf permanecem como **materiais complementares**.
- Referências oficiais e bibliografia da UC permanecem nas secções existentes.
- Sem eliminar relações, sem merge, sem reordenar aulas, sem duplicar registos de progresso e sem alterar outras UCs.

## Implementação

A migração `20261116211500_facodi_estatistica_single_study_path_presentation.sql` configura unicamente `curricular_units.metadata.facodi_study_path_v1`, depois de validar exatamente os 13 IDs YouTube, a playlist, as sequências suplementares, o guia e o recurso avulso.

O frontend interpreta esta configuração opcional com `parseStudyPath`, verifica que a sequência pública continua a corresponder **exatamente** aos vídeos associados aos três grupos e apresenta `UnitStudyPath`.

As outras UCs, sem esta propriedade, conservam o layout anterior. Se a playlist mudar sem rever a configuração de secções, o frontend mostra uma mensagem editorial e uma ligação à sequência original, em vez de apresentar secções erradas.

## Regressões a verificar antes do merge/deploy

1. `bun run typecheck`, `bun run test`, `bun run build` e acessibilidade básica.
2. Página pública da UC: só um percurso, três secções, treze vídeos, acesso ao guia, duas sequências suplementares e um vídeo avulso.
3. Link **Continuar** abre a playlist canónica e mantém a gravação de progresso existente para utilizadores autenticados; visitas anónimas não apresentam dados de progresso.
4. Página `/sequences/:slug` e `/modules/:slug` permanecem funcionais, sem mudanças de URLs.
5. As demais unidades curriculares mantêm as secções atuais, incluindo os seus vídeos e módulos.
6. Confirmar os quatro idiomas em móvel e desktop; validar compatibilidade com publicação Cloudflare.

## Reversão

Reverter a vista de frontend é suficiente para regressar ao layout antigo. No Supabase, remover apenas a chave `facodi_study_path_v1` da unidade alvo (após snapshot/controlo de concorrência) restabelece a apresentação padrão sem tocar nos objetos, nas relações ou no progresso.
