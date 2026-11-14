import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StageState = 'waiting' | 'running' | 'done' | 'attention' | 'blocked';
export interface Stage { key: string; icon: LucideIcon; label: string; detail: string; state: StageState }

const STEP_MS = 380;

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveals stages one after another for each analysed URL, never past a stage that is still
 * working (its real state is "running"). Reduced motion reveals everything at once.
 */
export function useStagedReveal(stages: Stage[], runKey: string | null) {
  const [count, setCount] = useState(0);
  const firstRunning = stages.findIndex(stage => stage.state === 'running');
  const limit = firstRunning === -1 ? stages.length : firstRunning;
  useEffect(() => setCount(0), [runKey]);
  useEffect(() => {
    if (!runKey || count >= limit) return;
    if (prefersReducedMotion()) { setCount(limit); return; }
    const timer = window.setTimeout(() => setCount(current => Math.min(current + 1, limit)), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [runKey, count, limit]);
  const shown = stages.map((stage, index): Stage => index < count ? stage
    : { ...stage, state: index === count ? 'running' : 'waiting' });
  return { stages: shown, complete: !!runKey && count >= stages.length };
}
