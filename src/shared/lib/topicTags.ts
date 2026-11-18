/**
 * Resource tags mix study topics ("álgebra", "psicologia") with editorial bookkeeping: source and format
 * ("youtube", "recurso-externo"), curation stage ("apoio-ao-estudo", "curadoria-facodi"), institutions and
 * course codes ("ualg", "LESTI"), years and channel names. Only study topics are shown to learners and
 * offered as keywords; the full list stays in the data for editors and filters.
 */
const normalize = (tag: string) => tag.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[\s_]+/g, '-');

const EDITORIAL = new Set([
  // Source and format
  'youtube', 'video', 'video-externo', 'video-educativo', 'videoaula-externa', 'playlist', 'leitura', 'documentacao', 'bibliografia',
  'recurso-externo', 'referencia-externa', 'recurso-complementar', 'estudo-complementar', 'leitura-complementar',
  // Curation and platform
  'facodi', 'curadoria', 'curadoria-facodi', 'apoio-ao-estudo', 'autoestudo', 'guia-estudo', 'guia-original', 'atividade-original',
  'exercicio-original', 'solucao-comentada', 'sem-exercicios', 'sequencia', 'sequencia-editorial', 'sequencia-video',
  'modulo-de-estudo', 'topico', 'uc', 'unidade-curricular', 'curso-oficial', 'mandatory', 'instituicao-de-ensino',
  // Institutions, courses and channels
  'ualg', 'ifes', 'ifes-2026', 'ufes', 'univesp', 'mesalva', 'crashcourse', 'british-council', 'teachingenglish',
  'lesti', 'lpsi', 'ldcom', 'mncn', 'ctesp-sti', 'lgest', 'letras-ingles',
]);

/** True for a tag that names something to study, false for editorial bookkeeping. */
export function isStudyTopic(tag: string) {
  const key = normalize(tag);
  return !!key && !EDITORIAL.has(key) && !/^\d{4}(-\d{2})?$/.test(key) && !key.startsWith('opt-');
}

export const studyTopics = (tags: readonly string[] | null | undefined) => (tags ?? []).filter(isStudyTopic);
