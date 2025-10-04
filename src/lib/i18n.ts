import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en-complete.json';
import esTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import frTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import deTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import ptTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import ptBrTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import arTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import koTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import msTranslations from './locales/en-complete.json';  // Temporary - using English until translated
import idTranslations from './locales/en-complete.json';  // Temporary - using English until translated

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      de: { translation: deTranslations },
      pt: { translation: ptTranslations },
      'pt-BR': { translation: ptBrTranslations },
      ar: { translation: arTranslations },
      ko: { translation: koTranslations },
      ms: { translation: msTranslations },
      id: { translation: idTranslations },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
