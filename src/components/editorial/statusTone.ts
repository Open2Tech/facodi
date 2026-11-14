// Editorial states use a neutral ramp so they never compete with the content-type colours; sun marks drafts as pending work.
const SWATCHES: Record<string, string> = {
  active: 'bg-foreground',
  published: 'bg-foreground/55',
  draft: 'bg-primary',
  archived: 'bg-muted-foreground/30',
};

export function stateSwatch(status: string) {
  return SWATCHES[status] ?? 'bg-brand-coral';
}
