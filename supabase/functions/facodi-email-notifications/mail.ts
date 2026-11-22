import { renderEmailLayout, emailButton } from "../_shared/email-layout.ts";
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

export function deliveryFailure(httpStatus: number, previousAttempts: number, providerError?: string) {
  const concurrent = httpStatus === 409 && providerError === 'concurrent_idempotent_requests';
  const invalid = httpStatus === 409 && providerError === 'invalid_idempotent_request';
  const transient = concurrent || httpStatus === 0 || httpStatus === 429 || httpStatus >= 500;
  return {
    retry: transient && previousAttempts < 4,
    delaySeconds: Math.min(3600, 60 * 2 ** previousAttempts),
    code: concurrent ? 'email_provider_concurrent_idempotent_requests'
      : invalid ? 'email_provider_invalid_idempotent_request'
      : httpStatus ? `email_provider_http_${httpStatus}` : 'email_provider_timeout',
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
  const html = renderEmailLayout({
    language: lang, title: heading, preheader: received ? c.pending : approved ? c.accepted : c.declined,
    category: { pt: 'Contribuir para o campus', en: 'Campus contributions', es: 'Contribuir al campus', fr: 'Contribuer au campus' }[lang],
    tone: received ? 'cyan' : approved ? 'mint' : 'orange',
    contentHtml: `<p style="font-size:16px;line-height:1.75;margin:0 0 20px">${escape(detail)}</p>
<p style="font-size:16px;line-height:1.65;padding:16px;border-left:4px solid #37bdd2;background:#fdfcf7"><strong>${escape(playlist ? c.playlist : c.resource)}:</strong> ${escape(title)}</p>
${note && !received ? `<p style="font-size:16px;line-height:1.75"><strong>${escape(c.note)}:</strong><br>${escape(note)}</p>` : ''}
<p style="font-size:16px;line-height:1.75">${escape(c.thanks)}</p>
${emailButton(resourceUrl ? c.open : c.status, resourceUrl ?? statusUrl)}
${resourceUrl ? `<p><a href="${statusUrl}" style="color:#142948;text-decoration:underline">${escape(c.status)}</a></p>` : ''}`,
    footerHtml: escape(c.footer),
  });
  return {
    subject: `FACODI · ${heading}`,
    html,
    text: `${heading}\n\n${detail}\n\n${label}: ${title}${note ? `\n\n${c.note}: ${note}` : ''}\n\n${c.thanks}\n\n${resourceUrl ? `${c.open}: ${resourceUrl}\n` : ''}${c.status}: ${statusUrl}\n\n${c.footer}`,
  };
}
