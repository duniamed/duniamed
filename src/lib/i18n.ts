import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translateText } from './translationService';

import enTranslations from './locales/en-complete.json';
import esTranslations from './locales/es-full.json';
import frTranslations from './locales/fr-full.json';
import deTranslations from './locales/de-full.json';
import ptTranslations from './locales/pt-full.json';
import ptBrTranslations from './locales/pt-BR-full.json';
import arTranslations from './locales/ar-full.json';
import koTranslations from './locales/ko-full.json';
import msTranslations from './locales/ms-full.json';
import idTranslations from './locales/id-full.json';

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
    // Auto-translate missing keys
    saveMissing: true,
    missingKeyHandler: async (lngs, ns, key, fallbackValue) => {
      const lng = Array.isArray(lngs) ? lngs[0] : lngs;
      if (lng !== 'en' && fallbackValue && typeof fallbackValue === 'string') {
        // Auto-translate in background
        translateText(fallbackValue, lng, 'en').then((translated) => {
          i18n.addResource(lng, ns, key, translated);
        }).catch(console.error);
      }
    },
  });

export default i18n;
