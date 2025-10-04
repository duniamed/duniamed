import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { translateText, clearTranslationCache } from '@/lib/translationService';
import { Loader2, Languages, Trash2 } from 'lucide-react';

/**
 * Translation Manager Component
 * Admin utility to bulk-translate all keys
 */

export function TranslationManager() {
  const { t, i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const languages = ['es', 'fr', 'de', 'pt', 'pt-BR', 'ar', 'ko', 'ms', 'id'];

  const handleBulkTranslate = async () => {
    setIsTranslating(true);
    
    try {
      // Get all English keys
      const enResource = i18n.getResourceBundle('en', 'translation');
      const keys = getAllKeys(enResource);
      
      setProgress({ current: 0, total: keys.length * languages.length });

      for (const lang of languages) {
        for (const { key, value } of keys) {
          try {
            const translated = await translateText(value, lang, 'en');
            i18n.addResource(lang, 'translation', key, translated);
            
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
          } catch (error) {
            console.error(`Translation error for ${lang}:${key}`, error);
          }
        }
      }

      toast.success('All translations completed!');
    } catch (error) {
      console.error('Bulk translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleClearCache = () => {
    clearTranslationCache();
    toast.success('Translation cache cleared');
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Languages className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Translation Manager</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Automatically translate all content into {languages.length} languages using AI.
      </p>

      <div className="flex gap-2">
        <Button
          onClick={handleBulkTranslate}
          disabled={isTranslating}
          className="flex-1"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating... {progress.current}/{progress.total}
            </>
          ) : (
            <>
              <Languages className="mr-2 h-4 w-4" />
              Translate All Languages
            </>
          )}
        </Button>

        <Button
          onClick={handleClearCache}
          variant="outline"
          disabled={isTranslating}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>• Translations are cached for instant loading</p>
        <p>• Missing translations are auto-translated on-demand</p>
        <p>• Uses Lovable AI translation service</p>
      </div>
    </Card>
  );
}

// Helper to flatten nested translation keys
function getAllKeys(obj: any, prefix = ''): Array<{ key: string; value: string }> {
  const keys: Array<{ key: string; value: string }> = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      keys.push({ key: fullKey, value });
    } else if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value, fullKey));
    }
  }
  
  return keys;
}
