
import React from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface Props {
  content: string;
}

const MarkdownView: React.FC<Props> = ({ content }) => {
  // Render markdown to HTML and sanitize before injecting into DOM.
  const html = React.useMemo(() => {
    const rawHtml = marked.parse(content, {
      gfm: true,
      breaks: true,
      async: false,
    });

    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|\/)/i,
      FORBID_TAGS: ['script', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
  }, [content]);

  return (
    <div 
      className="prose prose-stark max-w-none 
        prose-headings:font-black 
        prose-headings:uppercase 
        prose-headings:tracking-tighter 
        prose-h1:text-5xl lg:prose-h1:text-6xl prose-h1:mb-12
        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
        prose-p:font-medium prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-lg
        prose-li:text-gray-600 prose-li:font-medium
        prose-strong:font-black prose-strong:text-black
        prose-a:text-black prose-a:underline prose-a:decoration-primary prose-a:decoration-4 prose-a:underline-offset-4 hover:prose-a:bg-primary
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-brand-muted prose-blockquote:p-8 prose-blockquote:italic
        prose-code:bg-brand-muted prose-code:px-2 prose-code:py-0.5 prose-code:font-bold prose-code:text-black before:content-none after:content-none
        prose-pre:bg-black prose-pre:text-white prose-pre:rounded-none prose-pre:p-8 prose-pre:stark-border
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownView;
