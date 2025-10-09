import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { debounce } from 'lodash';

interface AIAutofillInputProps {
  label: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  context?: string;
  placeholder?: string;
}

export function AIAutofillInput({
  label,
  fieldName,
  value,
  onChange,
  context,
  placeholder
}: AIAutofillInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = debounce(async (partialValue: string) => {
    if (!partialValue || partialValue.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-autofill', {
        body: {
          fieldName,
          partialValue,
          context
        }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (value) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleSelectSuggestion = (suggestion: any) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={fieldName}>{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={fieldName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="font-medium text-sm text-foreground">{suggestion.label}</div>
              {suggestion.value !== suggestion.label && (
                <div className="text-xs text-muted-foreground">{suggestion.value}</div>
              )}
              <div className="text-xs text-muted-foreground">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}