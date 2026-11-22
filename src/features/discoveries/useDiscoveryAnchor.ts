import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useDiscoveryAnchor(id: string, enabled = true) {
  const { hash, key } = useLocation();

  useEffect(() => {
    if (!enabled || hash !== `#${id}`) return;
    const frame = requestAnimationFrame(() => {
      const button = document.querySelector<HTMLButtonElement>(`#${id} button`);
      button?.focus({ preventScroll: true });
      button?.scrollIntoView?.({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [enabled, hash, id, key]);
}
