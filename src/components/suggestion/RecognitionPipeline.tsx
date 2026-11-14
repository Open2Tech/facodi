import { AlertTriangle, Check, Loader2, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stage, StageState } from '@/components/suggestion/useStagedReveal';

const FILLS: Record<StageState, string> = {
  waiting: 'border border-input bg-background text-muted-foreground',
  running: 'bg-brand-cyan text-ink',
  done: 'bg-brand-mint text-ink',
  attention: 'bg-primary text-ink',
  blocked: 'bg-brand-coral text-ink',
};
const STATE_ICONS: Partial<Record<StageState, LucideIcon>> = { done: Check, attention: AlertTriangle, blocked: X };
export function RecognitionPipeline({ stages, label }: { stages: Stage[]; label: string }) {
  const settled = stages.filter(stage => stage.state !== 'waiting' && stage.state !== 'running').length;
  const current = stages.find(stage => stage.state === 'running');
  return <div>
    <div className="h-1 overflow-hidden bg-input" role="progressbar" aria-label={label}
      aria-valuemin={0} aria-valuemax={stages.length} aria-valuenow={settled}>
      <div className="h-full origin-left bg-foreground transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${settled / stages.length})` }} />
    </div>
    <ol className="grid border-x border-b border-input sm:grid-cols-2 xl:grid-cols-4">
      {stages.map(({ key, icon, label: stageLabel, detail, state }, index) => {
        const StateIcon = STATE_ICONS[state] ?? icon;
        return <li key={key} data-state={state}
          className={cn('flex gap-3 border-input p-4 transition-colors duration-300',
            index > 0 && 'border-t sm:border-t-0', index % 2 === 1 && 'sm:border-l', index >= 2 && 'sm:border-t xl:border-t-0', index > 0 && 'xl:border-l')}>
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center transition-colors duration-300', FILLS[state])}>
            {state === 'running'
              ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              : <StateIcon className="h-4 w-4" aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{stageLabel}</span>
            <span className={cn('mt-0.5 block break-words text-sm', state === 'waiting' ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
              {state === 'waiting' || state === 'running' ? '…' : detail}
            </span>
          </span>
        </li>;
      })}
    </ol>
    <p className="sr-only" aria-live="polite">{current ? current.label : settled === stages.length ? stages.map(stage => `${stage.label}: ${stage.detail}`).join('. ') : ''}</p>
  </div>;
}
