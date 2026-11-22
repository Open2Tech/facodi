/** Email-safe equivalent of src/index.css light theme. No remote fonts or images.
 * contentHtml/footerHtml are trusted markup; escape user values before passing them.
 */
export const EMAIL_COLORS = {
  ink: '#142948', paper: '#fdfcf7', sun: '#eeff00', cyan: '#37bdd2',
  mint: '#a6e8bd', orange: '#ffad33', pink: '#ff70a7', coral: '#ff8a7a', blue: '#3778c8',
} as const;
const LANGUAGE = {
  pt: { tagline: 'Um campus digital aberto.', thread: 'O conhecimento liga-nos.', name: 'Faculdade Comunitária Digital' },
  en: { tagline: 'An open digital campus.', thread: 'Knowledge connects us.', name: 'Digital Community College' },
  es: { tagline: 'Un campus digital abierto.', thread: 'El conocimiento nos conecta.', name: 'Facultad Comunitaria Digital' },
  fr: { tagline: 'Un campus numérique ouvert.', thread: 'Le savoir nous relie.', name: 'Faculté Communautaire Numérique' },
} as const;

export type EmailTone = 'sun' | 'cyan' | 'mint' | 'orange' | 'pink' | 'coral';

export const escapeEmailHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function emailButton(label: string, href: string, secondary = false): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0"><tr><td bgcolor="${secondary ? EMAIL_COLORS.paper : EMAIL_COLORS.sun}" style="border:2px solid ${EMAIL_COLORS.ink};border-radius:4px"><a href="${escapeEmailHtml(href)}" style="display:inline-block;padding:14px 20px;color:${EMAIL_COLORS.ink};font-size:16px;line-height:1.5;font-weight:700;text-decoration:none">${escapeEmailHtml(label)}</a></td></tr></table>`;
}

export function renderEmailLayout(input: {
  language?: keyof typeof LANGUAGE;
  title: string; preheader: string; category: string; tone: EmailTone;
  contentHtml: string; footerHtml: string;
}): string {
  const c = EMAIL_COLORS;
  const language = input.language ?? 'pt';
  const copy = LANGUAGE[language];
  return `<!doctype html>
<html lang="${language === 'pt' ? 'pt-PT' : language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeEmailHtml(input.title)} — FACODI</title>
</head>
<body style="margin:0;padding:0;background:${c.paper};font-family:'Space Grotesk',Arial,Helvetica,sans-serif;color:${c.ink};-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeEmailHtml(input.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${c.paper}" style="border-collapse:collapse"><tr><td align="center" style="padding:24px 12px">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:2px solid ${c.ink};border-collapse:separate;border-spacing:0;background:#ffffff">
<tr><td style="padding:24px;background:${c.paper};border-bottom:2px solid ${c.ink}">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td width="54" valign="middle"><a href="https://facodi.com" aria-label="FACODI" style="display:inline-block;background:${c.sun};border:2px solid ${c.ink};padding:6px 9px;color:${c.ink};font-size:29px;line-height:1.2;font-weight:700;text-decoration:none">F.</a></td>
<td style="padding-left:14px"><a href="https://facodi.com" style="color:${c.ink};font-size:25px;font-weight:700;letter-spacing:-1px;line-height:1.2;text-decoration:none">FACODI</a><div style="margin-top:5px;font-size:12px;line-height:1.6">${copy.tagline}</div></td>
</tr></table></td></tr>
<tr><td bgcolor="${c[input.tone]}" style="padding:12px 24px;border-bottom:2px solid ${c.ink};color:${c.ink};font-family:'IBM Plex Mono',Consolas,monospace;font-size:12px;font-weight:700;line-height:1.6;letter-spacing:1px;text-transform:uppercase">${escapeEmailHtml(input.category)}</td></tr>
<tr><td style="padding:30px 24px;overflow-wrap:anywhere;word-break:break-word">
<h1 style="margin:0 0 22px;font-size:30px;line-height:1.15;letter-spacing:-0.8px;font-weight:700;color:${c.ink}">${escapeEmailHtml(input.title)}</h1>
${input.contentHtml}
</td></tr>
<tr><td><table role="presentation" aria-hidden="true" width="100%" cellspacing="0" cellpadding="0"><tr>${(['sun','cyan','mint','orange','pink','coral'] as const).map(tone => `<td bgcolor="${c[tone]}" height="8" style="font-size:0;line-height:8px">&nbsp;</td>`).join('')}</tr></table></td></tr>
<tr><td bgcolor="${c.ink}" style="padding:24px;color:#ffffff">
<p style="margin:0 0 14px;color:${c.sun};font-size:18px;line-height:1.4;font-weight:700">${copy.thread}</p>
<div style="font-size:12px;line-height:1.75;color:#ffffff">${input.footerHtml}</div>
<p style="margin:16px 0 0;font-family:Consolas,monospace;font-size:12px;line-height:1.8"><a href="https://facodi.com" style="color:#ffffff;text-decoration:underline">facodi.com</a> · ${copy.name}</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>\n`;
}
