import { createContext, useContext, useLayoutEffect } from 'react';
import { STATIC_HEAD_ATTRIBUTE } from '@/shared/seo/seo';

// On React 19, Helmet only renders tags for React to hoist and never deduplicates them,
// so the layout defaults step aside while a page provides its own metadata.
export type SeoClaims = { page: number; robots: number };
export type SeoClaim = keyof SeoClaims;

export const SeoClaimsContext = createContext<{ claims: SeoClaims; claim: (key: SeoClaim) => () => void } | null>(null);

export function useSeoClaims() {
  return useContext(SeoClaimsContext)?.claims ?? { page: 0, robots: 0 };
}

export function useSeoClaim(...keys: SeoClaim[]) {
  const claim = useContext(SeoClaimsContext)?.claim;
  const signature = keys.join();
  useLayoutEffect(() => {
    if (!claim) return;
    const releases = signature.split(',').map(key => claim(key as SeoClaim));
    return () => releases.forEach(release => release());
  }, [claim, signature]);
}

/** The shell's static tags serve crawlers without JavaScript; React owns the head afterwards. */
export function removeStaticHeadTags(head: ParentNode = document.head) {
  head.querySelectorAll(`[${STATIC_HEAD_ATTRIBUTE}]`).forEach(node => node.remove());
}
