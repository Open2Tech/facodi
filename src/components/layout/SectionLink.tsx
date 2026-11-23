import type { ComponentProps } from 'react';
import { Link, useLocation } from 'react-router-dom';

type SectionLinkProps = Omit<ComponentProps<typeof Link>, 'to' | 'state'> & {
  hash: `#${string}`;
};

/** Same-page navigation must retain the router state that carries the learner's origin. */
export function SectionLink({ hash, onClick, ...props }: SectionLinkProps) {
  const { pathname, search, state } = useLocation();
  return <Link {...props} to={{ pathname, search, hash }} state={state} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.currentTarget.target && event.currentTarget.target !== '_self')) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView();
    target?.focus({ preventScroll: true });
  }} />;
}
