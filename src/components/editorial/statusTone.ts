// Editorial states use a neutral ramp so they never compete with the content-type colours; sun marks drafts as pending work.
const SWATCHES: Record<string, string> = {
  active: 'bg-foreground',
  published: 'bg-foreground/55',
  draft: 'bg-primary',
  archived: 'bg-muted-foreground/30',
  // Review and import workflows reuse the ramp; unknown or failed states fall back to coral.
  pending: 'bg-primary',
  approved: 'bg-foreground',
  accepted: 'bg-foreground',
  completed: 'bg-foreground',
  partial: 'bg-foreground/55',
  rejected: 'bg-muted-foreground/30',
  duplicate: 'bg-brand-coral',
};

export function stateSwatch(status: string) {
  return SWATCHES[status] ?? 'bg-brand-coral';
}
