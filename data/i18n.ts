/**
 * Internationalization (i18n) module for FACODI
 * 
 * This module provides basic translation infrastructure.
 * Currently supports Portuguese (pt) and English (en).
 * 
 * Note: Full translation strings will be added as needed.
 * Components currently use hardcoded locale strings (e.g., 'pt-PT')
 * for date/time formatting via native JS Intl APIs.
 */

import { translations } from './translations';

export type Locale = 'pt' | 'en';

export interface Translator {
  locale: Locale;
  t: (key: string, defaultValue?: string) => string;
}

/**
 * Create a translator for the given locale
 * @param locale The target locale ('pt' or 'en')
 * @returns A translator object with a t() method for looking up translations
 */
export function createTranslator(locale: Locale): Translator {
  return {
    locale,
    t: (key: string, defaultValue = key) => {
      const trans = translations[locale] as Record<string, string>;
      return trans?.[key] || defaultValue;
    },
  };
}
