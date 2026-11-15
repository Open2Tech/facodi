import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Renders locale prose with Markdown-style `[label](href)` links: internal paths use the router, others open as external links. */
export function LegalRichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const [whole, label, href] = match;
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const className = 'font-semibold text-foreground underline underline-offset-4 decoration-1 hover:decoration-2';
    if (href.startsWith('/') || href.startsWith('#')) {
      parts.push(<Link key={index} to={href} className={className}>{label}</Link>);
    } else {
      const external = href.startsWith('http');
      parts.push(<a key={index} href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>);
    }
    last = index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}
