import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

interface SearchResult {
  id: string;
  user_id: string;
  content_type: string;
  content_text: string;
  metadata: any;
  similarity: number;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: string;
  };
}

export const SemanticSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/semantic-search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 10
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, specialists, clinics..."
          className="pl-10 pr-4 h-12 bg-background"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      {query && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
          {results.length === 0 && !isSearching && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No results found for "{query}"
              </p>
            </Card>
          )}

          {results.map((result, index) => (
            <Card 
              key={result.id} 
              className="p-4 hover:shadow-md transition-all cursor-pointer animate-in fade-in slide-in-from-top-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={result.profile?.avatar_url} />
                  <AvatarFallback>
                    {result.profile?.first_name?.[0]}
                    {result.profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {result.profile?.first_name} {result.profile?.last_name}
                    </h3>
                    {result.profile?.role && (
                      <Badge variant="secondary" className="text-xs">
                        {result.profile.role}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {result.content_text}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {result.content_type}
                      </Badge>
                    </span>
                    <span className="text-primary font-medium">
                      {(result.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
