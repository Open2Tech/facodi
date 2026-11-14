import DOMPurify from 'dompurify';
import { useMemo } from 'react';

export function SafeHtml({ html }: { html: string | null }) {
  const clean = useMemo(() => DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  }), [html]);
  return <div className="prose max-w-prose break-words text-foreground prose-headings:font-sans prose-a:text-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: clean }} />;
}
