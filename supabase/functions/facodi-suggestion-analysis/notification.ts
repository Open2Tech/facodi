// Editorial email for the suggestion pipeline: pure, so Vitest covers it. Sent through Resend by index.ts.
import type { Decision, EvidenceLevel, Match, Notice } from "./analysis.ts";

const SITE = "https://facodi.com";

export type PipelineSettings = {
  auto_publish_enabled: boolean;
  ai_fallback_enabled: boolean;
  notification_email_enabled: boolean;
  notify_on_auto_publish: boolean;
  notify_on_review: boolean;
  notification_recipient: string;
};

export type NotificationInput = Notice & { decision: Decision; matches: Match[] };

const EVIDENCE: Record<EvidenceLevel, string> = {
  content_video: "Primeiros minutos do vídeo (vistos pelo Gemini) e metadados da plataforma",
  metadata_rich: "Descrição, capítulos ou dados do catálogo (sem ver o conteúdo)",
  metadata_only: "Apenas título e canal (sem ver o conteúdo)",
};

const REVIEW_REASONS: Record<string, string> = {
  auto_publish_disabled: "A publicação automática está desativada.",
  not_a_video: "Não é um vídeo do YouTube; a publicação automática só cobre vídeos.",
  no_course: "A sugestão não indica um curso, por isso a publicação automática não tem contexto curricular.",
  screening: "A triagem indicou uma licença restrita ou outro bloqueio.",
  no_strong_match_in_course: "A análise não encontrou uma correspondência forte no curso indicado.",
  not_confirmed: "Um modelo propôs uma correspondência forte, mas o segundo modelo não a confirmou.",
  existing_not_public: "O recurso já existe, mas está em rascunho ou arquivado.",
  no_candidates: "Não há unidades curriculares candidatas no catálogo.",
};

export function reviewReasonText(reason: string | undefined): string {
  return (reason && REVIEW_REASONS[reason]) || "A sugestão precisa de revisão editorial.";
}

const escape = (text: unknown) => String(text ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Returns null when the settings say this outcome should not be emailed.
export function buildNotification(settings: PipelineSettings, input: NotificationInput) {
  if (!settings.notification_email_enabled || input.decision.outcome === "skipped") return null;
  const published = input.decision.outcome === "published";
  if (published ? !settings.notify_on_auto_publish : !settings.notify_on_review) return null;

  const unit = published ? input.matches.find((m) => m.unit_id === input.decision.unit_id) : undefined;
  const links: Array<[string, string]> = published
    ? [
      ["Ver recurso", `${SITE}/resources/${encodeURIComponent(input.decision.object_slug ?? "")}`],
      ...(unit ? [["Ver unidade curricular", `${SITE}/courses/${encodeURIComponent(unit.course_slug)}/units/${encodeURIComponent(unit.slug)}`] as [string, string]] : []),
      ["Editar ou despublicar", `${SITE}/editor?kind=learning_objects&search=${encodeURIComponent(input.decision.object_slug ?? "")}`],
    ]
    : [["Rever sugestões", `${SITE}/editor/suggestions`]];

  const heading = published ? "Recurso publicado automaticamente" : "Sugestão a aguardar revisão";
  const summary = published
    ? `${input.decision.reused ? "O vídeo já estava no catálogo e foi associado" : "O vídeo foi publicado e associado"} a ${unit ? `«${unit.title}»` : "uma unidade curricular"}.`
    : reviewReasonText(input.decision.reason);
  const rows: Array<[string, string]> = [
    ["Título", input.title],
    ["Autor/canal", input.author ?? "—"],
    ["URL", input.url],
    ...(input.chosen
      ? [["Indicado pelo estudante", [input.chosen.unit_title, input.chosen.course_title].filter(Boolean).join(" · ")] as [string, string]]
      : []),
    ["Evidência analisada", EVIDENCE[input.evidence_level] ?? EVIDENCE.metadata_only],
    ["Análise", input.matches.length
      ? input.matches.map((m) => `${m.fit === "strong" ? "Forte" : "Parcial"} — ${m.title}: ${m.reason}` +
        (m.quote ? ` («${m.quote}»${m.grounded ? "" : ", citação não encontrada"})` : "")).join("\n")
      : "Sem correspondências."],
    ...(input.provider ? [["Modelo", input.provider] as [string, string]] : []),
  ];

  const text = [heading, "", summary, "", ...rows.map(([k, v]) => `${k}: ${v}`), "",
    ...links.map(([k, v]) => `${k}: ${v}`)].join("\n");
  const html = `<!doctype html><html lang="pt"><body style="margin:0;background:#faf9f2;font-family:Arial,Helvetica,sans-serif;color:#142846">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #d5dfe7;background:#ffffff">
<tr><td style="background:#142846;padding:26px 32px;border-bottom:4px solid #efff00">
<strong style="color:#ffffff;font-size:25px;letter-spacing:1px">FACODI</strong>
<div style="font-size:12px;color:#efff00;margin-top:5px">Curadoria automática de sugestões</div></td></tr>
<tr><td style="padding:30px 32px"><h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${escape(heading)}</h1>
<p style="font-size:15px;line-height:1.65;margin:0 0 18px">${escape(summary)}</p>
${rows.map(([k, v]) => `<p style="font-size:14px;line-height:1.6;margin:0 0 10px"><strong>${escape(k)}:</strong><br>${escape(v).replace(/\n/g, "<br>")}</p>`).join("\n")}
<p style="margin:24px 0 8px">${links.map(([k, v]) => `<a href="${escape(v)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 16px;background:#efff00;color:#142846;font-weight:700;text-decoration:none">${escape(k)}</a>`).join("")}</p>
<p style="font-size:12px;color:#526173;line-height:1.6">Pode desativar estes emails ou a publicação automática em facodi.suggestion_pipeline_settings (Supabase Studio).</p>
</td></tr></table></td></tr></table></body></html>`;

  const subject = `[FACODI] ${published ? "Publicado" : "Rever"}: ${input.title}`.slice(0, 160);
  return { to: settings.notification_recipient, subject, html, text };
}
