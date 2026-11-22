import { renderEmailLayout, emailButton } from "../_shared/email-layout.ts";
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
  const html = renderEmailLayout({
    title: heading, preheader: summary, category: "Curadoria do campus",
    tone: published ? "mint" : "orange",
    contentHtml: `<p style="font-size:16px;line-height:1.75;margin:0 0 22px">${escape(summary)}</p>
${rows.map(([k, v]) => `<p style="font-size:14px;line-height:1.7;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #d4dce7"><strong>${escape(k)}:</strong><br>${escape(v).replace(/\n/g, "<br>")}</p>`).join("\n")}
${links.map(([k, v], i) => emailButton(k, v, i > 0)).join("\n")}`,
    footerHtml: "Notificação editorial da FACODI. Pode gerir os avisos nas definições de curadoria.",
  });

  const subject = `[FACODI] ${published ? "Publicado" : "Rever"}: ${input.title}`.slice(0, 160);
  return { to: settings.notification_recipient, subject, html, text };
}
