import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { PREFERENCE_KEYS, readPreference, writePreference } from '@/shared/lib/preferenceStorage';

import translation_en from './locales/en.json';
import translation_es from './locales/es.json';
import translation_fr from './locales/fr.json';
import translation_pt from './locales/pt.json';

export const resources = {
  en: {
    translation: translation_en,
  },
  es: {
    translation: translation_es,
  },
  fr: {
    translation: translation_fr,
  },
  pt: {
    translation: translation_pt,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: readPreference(PREFERENCE_KEYS.language) || 'pt', // default language
    fallbackLng: 'en', // fallback language if translation is not found

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export const INTERFACE_LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
] as const;

export function setInterfaceLanguage(code: string) {
  writePreference(PREFERENCE_KEYS.language, code);
  void i18n.changeLanguage(code);
}

export default i18n;