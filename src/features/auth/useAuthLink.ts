import { useEffect, useRef, useState } from 'react';
import { processAuthLink } from '@/entities/auth/auth.api';
import { authErrorKey } from '@/entities/auth/authErrors';

export function useAuthLink(required: boolean) {
  const [url] = useState(() => new URL(window.location.href));
  const hasLink = url.searchParams.has('code') || url.searchParams.has('error') || url.hash.includes('error');
  const [state, setState] = useState<'pending' | 'ready' | 'invalid'>(hasLink ? 'pending' : required ? 'invalid' : 'ready');
  const [errorKey, setErrorKey] = useState('auth.error.invalidLink');
  const request = useRef<Promise<unknown> | null>(null);
  useEffect(() => {
    if (!hasLink) return;
    let active = true;
    request.current ??= processAuthLink(url);
    void request.current.then(() => {
      if (active) {
        window.history.replaceState(window.history.state, '', url.pathname + (url.searchParams.has('next') ? `?next=${encodeURIComponent(url.searchParams.get('next')!)}` : ''));
        setState('ready');
      }
    }, (reason: unknown) => {
      if (active) {
        window.history.replaceState(window.history.state, '', url.pathname);
        setErrorKey(authErrorKey(reason));
        setState('invalid');
      }
    });
    return () => { active = false; };
  }, [hasLink, url]);
  return { state, errorKey, next: url.searchParams.get('next'), hasLink };
}
