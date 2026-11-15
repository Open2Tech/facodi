# FACODI — identidade visual e higiene de media
**Atualização:** 15/11/2026 · **Branch:** `feature/facodi-brand-media-and-email-origin`

## Fonte visual
Mantivemos o símbolo **F.** do FACODI e a linguagem visual existente: Ink `#142846`, Sun `#EFFF00`, Cyan `#37BED2`, Blue `#3979C8`, Mint `#A7E8BE` e Paper `#F9FAFB`. Nenhuma biblioteca de UI, serviço externo ou framework foi adicionado.

## Media ativos
- `public/favicon.svg` — símbolo principal, vetor, 64×64.
- `public/favicon-{16x16,32x32,64x64}.png` — raster compatível.
- `public/apple-touch-icon.png` — 180×180.
- `public/pwa-{192x192,512x512}.png` — manifest PWA, 512×512 compatível com máscara.
- `public/social-preview-default.png` — 1200×630 (Open Graph / Twitter); versão de cache de partilhas: `?v=20261115`.
- `public/social-preview-default.svg` — variante vetorial editável para apresentações e materiais digitais.

Todas as imagens novas foram produzidas com geometria e cores FACODI, sem fontes remotas, fotografias pessoais, IPs, dados privados ou referências a Tube O2. O social preview não é uma captura de ecrã nem apresenta dados dinâmicos.

## Remoções
O pacote histórico `public/brand/o2t/` pertencia a outra identidade e não é referenciado pelos componentes ativos da FACODI. As nove imagens de demonstração `docs/*.png` remanescentes também não eram referenciadas pela documentação principal (README/docs). Foram eliminadas para evitar assets enganosos. O branding e os ficheiros **globais de Auth do Tube** em `supabase/email-templates/` foram preservados porque o Supabase Auth é partilhado.

## Entrega, revisão e continuidade
O `index.html`, a função `DEFAULT_IMAGE`, o manifest e o SEO de snapshots referem os ativos canónicos. O teste unitário verifica assinatura e dimensões dos PNG e regressões básicas. Validar partilhas Facebook/LinkedIn/WhatsApp após publicação do asset (caches externos podem demorar a atualizar) e verificar o ícone PWA após instalação. O domínio canónico é **https://facodi.com**, não `www.facodi.com`.

## Email no Supabase
O catálogo FACODI `facodi.email_template_catalog` foi corrigido no Supabase remoto e a migração foi sincronizada com Git. Os 13 modelos permanecem de **pré-visualização** (`delivery_enabled=false`); os seis templates globais de autenticação foram depois aplicados ao Auth alojado (ver [templates Auth](facodi-auth-email-templates.md)). A função transacional `facodi-email-notifications` foi redeployada, preservando JWT e regras de autorização, mas corrigindo links HTML/texto para `https://facodi.com/playlists/submit`. Nenhum email foi disparado. A configuração global `auth.site_url` (já `https://facodi.com` no projeto alojado) não foi alterada.
