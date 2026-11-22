export type MailKind = 'playlist_received' | 'playlist_approved' | 'playlist_rejected'
  | 'suggestion_received' | 'suggestion_approved' | 'suggestion_rejected';
export type MailEvent = {
  id: string; event_key: string; recipient_user_id: string;
  playlist_id: string | null; suggestion_id: string | null;
  template_name: MailKind; event_payload: Record<string, unknown>;
  attempts: number; created_at: string; first_attempt_at: string | null;
};
export type Submission = { submitted_by: string; status: string };

// A quick review must not suppress the thank-you queued just before it.
export function isSuperseded(event: MailEvent, submission: Submission | null) {
  if (!submission || submission.submitted_by !== event.recipient_user_id) return true;
  if (event.template_name.endsWith('_received')) return false;
  return !event.template_name.endsWith(`_${submission.status}`);
}

export function deliveryFailure(httpStatus: number, previousAttempts: number) {
  const transient = httpStatus === 0 || httpStatus === 429 || httpStatus >= 500;
  return {
    retry: transient && previousAttempts < 4,
    delaySeconds: Math.min(3600, 60 * 2 ** previousAttempts),
    code: httpStatus ? `email_provider_http_${httpStatus}` : 'email_provider_timeout',
  };
}

export function sameSecret(actual: string, expected: string) {
  if (expected.length < 32 || actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

const copy = {
  pt: {
    received: 'Obrigado por partilhares conhecimento!', approved: 'A tua sugestão foi aprovada!', rejected: 'A tua sugestão já foi revista',
    thanks: 'A tua contribuição ajuda a construir um campus com mais conhecimento para toda a gente.',
    pending: 'Recebemos a tua sugestão. Vamos analisá-la e avisar-te por email assim que houver uma decisão.',
    accepted: 'A revisão foi concluída e a tua sugestão foi aceite. A publicação pode ainda estar em preparação.',
    published: 'A tua sugestão foi aprovada e o recurso já está disponível na FACODI.',
    declined: 'Nesta revisão, a sugestão não foi aprovada. Obrigado por contribuíres — podes consultar o resultado e sugerir outros conteúdos.',
    resource: 'Conteúdo', playlist: 'Playlist', note: 'Nota da revisão', status: 'Consultar as minhas sugestões',
    open: 'Explorar o recurso', footer: 'Recebes esta mensagem porque enviaste uma sugestão na FACODI.',
  },
  en: {
    received: 'Thanks for sharing knowledge!', approved: 'Your suggestion was approved!', rejected: 'Your suggestion has been reviewed',
    thanks: 'Your contribution helps build a campus with more knowledge for everyone.',
    pending: 'We received your suggestion. We will review it and email you when a decision is made.',
    accepted: 'The review is complete and your suggestion was accepted. Publication may still be in preparation.',
    published: 'Your suggestion was approved and the resource is now available on FACODI.',
    declined: 'Your suggestion was not approved in this review. Thank you for contributing — you can check the result and suggest other content.',
    resource: 'Content', playlist: 'Playlist', note: 'Review note', status: 'View my suggestions',
    open: 'Explore the resource', footer: 'You received this message because you submitted a suggestion on FACODI.',
  },
  es: {
    received: '¡Gracias por compartir conocimiento!', approved: '¡Tu sugerencia fue aprobada!', rejected: 'Tu sugerencia ya fue revisada',
    thanks: 'Tu contribución ayuda a construir un campus con más conocimiento para todas las personas.',
    pending: 'Recibimos tu sugerencia. La revisaremos y te avisaremos por email cuando haya una decisión.',
    accepted: 'La revisión ha terminado y tu sugerencia fue aceptada. La publicación puede estar en preparación.',
    published: 'Tu sugerencia fue aprobada y el recurso ya está disponible en FACODI.',
    declined: 'La sugerencia no fue aprobada en esta revisión. Gracias por contribuir: puedes consultar el resultado y sugerir otros contenidos.',
    resource: 'Contenido', playlist: 'Playlist', note: 'Nota de revisión', status: 'Consultar mis sugerencias',
    open: 'Explorar el recurso', footer: 'Recibes este mensaje porque enviaste una sugerencia en FACODI.',
  },
  fr: {
    received: 'Merci de partager tes connaissances !', approved: 'Ta suggestion a été approuvée !', rejected: 'Ta suggestion a été examinée',
    thanks: 'Ta contribution aide à construire un campus avec plus de connaissances pour tout le monde.',
    pending: 'Nous avons reçu ta suggestion. Nous allons l’examiner et t’envoyer un email dès qu’une décision sera prise.',
    accepted: 'L’examen est terminé et ta suggestion a été acceptée. La publication peut encore être en préparation.',
    published: 'Ta suggestion a été approuvée et la ressource est disponible sur FACODI.',
    declined: 'La suggestion n’a pas été approuvée lors de cet examen. Merci pour ta contribution : tu peux consulter le résultat et proposer d’autres contenus.',
    resource: 'Contenu', playlist: 'Playlist', note: 'Note de révision', status: 'Consulter mes suggestions',
    open: 'Explorer la ressource', footer: 'Tu reçois ce message parce que tu as envoyé une suggestion sur FACODI.',
  },
};
const escape = (text: unknown) => String(text ?? '').replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function buildMail(event: MailEvent, locale: unknown = 'pt', publicSlug?: string) {
  const language = typeof locale === 'string' ? locale.toLowerCase().split(/[-_]/)[0] : 'pt';
  const lang = language in copy ? language as keyof typeof copy : 'pt';
  const c = copy[lang];
  const received = event.template_name.endsWith('_received');
  const approved = event.template_name.endsWith('_approved');
  const playlist = event.template_name.startsWith('playlist_');
  const title = String(event.event_payload.title ?? event.event_payload.playlist_title ?? '').slice(0, 200);
  const note = received ? '' : String(event.event_payload.review_note ?? '').slice(0, 2000);
  const heading = received ? c.received : approved ? c.approved : c.rejected;
  const resourceUrl = !playlist && approved && publicSlug ? `https://facodi.com/resources/${encodeURIComponent(publicSlug)}` : null;
  const detail = received ? c.pending : approved ? resourceUrl ? c.published : c.accepted : c.declined;
  const statusUrl = playlist ? 'https://facodi.com/playlists/submit' : 'https://facodi.com/suggest';
  const label = playlist ? c.playlist : c.resource;
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
<tr><td style="background:#142846;padding:26px 28px;border-radius:11px 11px 0 0;border-bottom:4px solid #efff00">
<strong style="color:#ffffff;font-size:25px;letter-spacing:1px">FACODI</strong>
<div style="font-size:12px;color:#efff00;margin-top:6px">Faculdade Comunitária Digital</div></td></tr>
<tr><td style="padding:30px 28px"><h1 style="font-size:25px;line-height:1.3;margin:0 0 18px">${escape(heading)}</h1>
<p style="font-size:15px;line-height:1.75">${escape(detail)}</p>
<p style="padding:16px;background:#f9fafb;border-left:4px solid #37bed2;line-height:1.6"><strong>${escape(label)}:</strong> ${escape(title)}</p>
${note ? `<p style="line-height:1.75;white-space:pre-line"><strong>${escape(c.note)}:</strong><br>${escape(note)}</p>` : ''}
<p style="font-size:15px;line-height:1.75">${escape(c.thanks)}</p>
<p style="margin:26px 0"><a href="${resourceUrl ?? statusUrl}" style="display:inline-block;padding:13px 19px;border-radius:7px;background:#efff00;color:#142846;font-weight:700;text-decoration:none">${escape(resourceUrl ? c.open : c.status)}</a></p>
${resourceUrl ? `<p><a href="${statusUrl}" style="color:#3979c8">${escape(c.status)}</a></p>` : ''}
</td></tr><tr><td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e4ebf0;border-radius:0 0 11px 11px;font-size:12px;line-height:1.65;color:#526173">${escape(c.footer)}</td></tr>
</table></td></tr></table></body></html>`;
  return {
    subject: `FACODI · ${heading}`,
    html,
    text: `${heading}\n\n${detail}\n\n${label}: ${title}${note ? `\n\n${c.note}: ${note}` : ''}\n\n${c.thanks}\n\n${resourceUrl ? `${c.open}: ${resourceUrl}\n` : ''}${c.status}: ${statusUrl}\n\n${c.footer}`,
  };
}
