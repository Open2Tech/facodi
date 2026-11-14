import { Fragment, type ReactNode } from 'react';

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index} className="border border-input bg-muted px-1 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function paragraph(text: string, key: number) {
  const lines = text.split('\n');
  return <p key={key}>{lines.map((line, index) => <Fragment key={index}>{index > 0 && <br />}{inline(line)}</Fragment>)}</p>;
}

/**
 * The small Markdown subset the notebook toolbar writes: **bold**, *italic*, `code` and fenced
 * code blocks. Built from React elements, so note text can never inject markup.
 */
export function NoteBody({ text }: { text: string }) {
  const blocks = text.trim().split(/```/);
  return <div className="space-y-2 text-sm leading-relaxed">
    {blocks.flatMap((block, index) => {
      if (index % 2 === 1) {
        const code = block.replace(/^[\w+-]*\n/, '').replace(/\n$/, '');
        return [<pre key={`code-${index}`} className="overflow-x-auto border border-input bg-muted px-3 py-2 font-mono text-xs leading-relaxed"><code>{code}</code></pre>];
      }
      return block.split(/\n{2,}/).map(part => part.trim()).filter(Boolean).map((part, offset) => paragraph(part, index * 1000 + offset));
    })}
  </div>;
}
