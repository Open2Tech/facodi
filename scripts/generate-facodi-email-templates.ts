import { readFileSync, writeFileSync } from 'node:fs';
import { renderEmailLayout } from '../supabase/functions/_shared/email-layout.ts';
const entries = JSON.parse(readFileSync(new URL('../supabase/email-templates/content.json', import.meta.url), 'utf8'));
for (const [name, input] of Object.entries(entries)) {
  const path = new URL(`../supabase/email-templates/facodi/${name}.html`, import.meta.url);
  const html = renderEmailLayout(input as Parameters<typeof renderEmailLayout>[0]);
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== html) throw new Error(`Regenerate ${name}.html with bun run email:generate`);
  } else writeFileSync(path, html);
}
console.log(`FACODI: ${Object.keys(entries).length} emails ${process.argv.includes('--check') ? 'in sync' : 'generated'}.`);
