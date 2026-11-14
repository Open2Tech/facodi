/** Plain-text excerpt of possibly-HTML content; DOMParser never executes scripts. */
export function plainText(value: string | null | undefined) {
  if (!value) return '';
  const text = new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
}

/** Learning-object objectives are free JSON; only render string lists. */
export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  return [];
}
