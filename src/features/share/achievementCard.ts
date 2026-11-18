/**
 * Story-format image (1080×1920) a learner can share after finishing a sequence. Drawn in the browser,
 * never uploaded; brand colours with a single yellow accent on ink.
 */
export const CARD = { width: 1080, height: 1920 } as const;
const INK = 'hsl(216, 56%, 18%)';
const PAPER = 'hsl(50, 60%, 98%)';
const ACCENT = 'hsl(64, 100%, 50%)';
const SANS = '"Space Grotesk", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** Greedy word wrap; the last kept line ends with an ellipsis when the text does not fit. */
export function wrapLines(measure: (text: string) => number, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.includes(' ') && measure(`${last}…`) > maxWidth) last = last.slice(0, last.lastIndexOf(' '));
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

export interface AchievementCard { eyebrow: string; title: string; detail: string; site: string }

export function drawAchievementCard(ctx: CanvasRenderingContext2D, card: AchievementCard) {
  const { width, height } = CARD;
  const margin = 96;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = PAPER;
  ctx.font = `700 64px ${SANS}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('FACODI', margin, 200);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(margin + ctx.measureText('FACODI').width + 10, 186, 16, 16);

  // Title block sits in the lower part of the story, above the yellow bar; the top stays free for stickers.
  ctx.font = `600 104px ${SANS}`;
  const lines = wrapLines(text => ctx.measureText(text).width, card.title, width - margin * 2, 6);
  const bar = 220;
  const titleTop = height - bar - 200 - lines.length * 120;

  ctx.font = `500 40px ${MONO}`;
  const eyebrow = card.eyebrow.toUpperCase();
  const pad = 24;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(margin, titleTop - 190, ctx.measureText(eyebrow).width + pad * 2, 76);
  ctx.fillStyle = INK;
  ctx.fillText(eyebrow, margin + pad, titleTop - 138);

  ctx.fillStyle = PAPER;
  ctx.font = `600 104px ${SANS}`;
  lines.forEach((line, index) => ctx.fillText(line, margin, titleTop + index * 120));

  ctx.font = `400 44px ${MONO}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText(card.detail, margin, titleTop + (lines.length - 1) * 120 + 100);
  ctx.globalAlpha = 1;

  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, height - bar, width, bar);
  ctx.fillStyle = INK;
  ctx.font = `700 56px ${SANS}`;
  ctx.fillText(card.site, margin, height - 92);
}

export async function createAchievementImage(card: AchievementCard): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available.');
  drawAchievementCard(ctx, card);
  return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Image export failed.'))), 'image/png'));
}
