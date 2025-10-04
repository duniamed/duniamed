import { supabase } from '@/integrations/supabase/client';

/**
 * Translation Service
 * Automatically translates missing keys using Lovable AI
 * with caching for performance
 */

const CACHE_KEY = 'translation_cache';
const CACHE_VERSION = 'v1';

interface TranslationCache {
  version: string;
  translations: Record<string, string>;
}

// Get cache from localStorage
function getCache(): TranslationCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.version === CACHE_VERSION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading translation cache:', error);
  }
  return { version: CACHE_VERSION, translations: {} };
}

// Save cache to localStorage
function saveCache(cache: TranslationCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving translation cache:', error);
  }
}

// Translate text using edge function
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> {
  // Check cache first
  const cache = getCache();
  const cacheKey = `${sourceLanguage}_${targetLanguage}_${text}`;
  
  if (cache.translations[cacheKey]) {
    return cache.translations[cacheKey];
  }

  try {
    const { data, error } = await supabase.functions.invoke('translate-support', {
      body: {
        text,
        sourceLanguage,
        targetLanguage,
      },
    });

    if (error) throw error;

    const translatedText = data.translatedText || text;

    // Cache the translation
    cache.translations[cacheKey] = translatedText;
    saveCache(cache);

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

// Language code mapping
const languageNames: { [key: string]: string } = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  'pt-BR': 'Brazilian Portuguese',
  ar: 'Arabic',
  ko: 'Korean',
  ms: 'Malay',
  id: 'Indonesian',
};

export function getLanguageName(code: string): string {
  return languageNames[code] || code;
}

// Clear translation cache
export function clearTranslationCache() {
  localStorage.removeItem(CACHE_KEY);
}
