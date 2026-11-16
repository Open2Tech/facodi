import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

type LocaleValue = string | number | boolean | null | LocaleValue[] | { [key: string]: LocaleValue };

function leafKeys(value: LocaleValue, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, childValue]) => (
    leafKeys(childValue, prefix ? `${prefix}.${key}` : key)
  ));
}

describe('i18n locales', () => {
  it('keeps pt/en/es/fr leaf keys aligned', () => {
    const locales = { pt, en, es, fr };
    const reference = leafKeys(pt).sort();

    for (const [locale, messages] of Object.entries(locales)) {
      expect(leafKeys(messages).sort(), locale).toEqual(reference);
    }
  });
  it('has localized labels for composed study-path section counts', () => {
    for (const messages of [pt, en, es, fr]) {
      expect(messages.composedPath.sequenceCount).toContain('{{count}}');
      expect(messages.composedPath.lessonCount).toContain('{{count}}');
    }
  });

});
