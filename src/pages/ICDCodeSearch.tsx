import { useState } from 'react';
import { Search, FileText, Copy, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ICDCodeSearch() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const search = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-icd-codes', {
        body: { searchTerm, codeSystem: 'ICD-11' }
      });

      if (error) throw error;

      setResults(data.codes || []);
      
      if (data.codes.length === 0) {
        toast({
          title: "No Results",
          description: "Try a different search term",
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    
    toast({
      title: "Copied!",
      description: `Code ${code} copied to clipboard`,
    });
  };

  return (
    <DashboardLayout title="ICD-11 Medical Codes">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">ICD-11 Code Search</h2>
              <p className="text-sm text-muted-foreground">
                Search the WHO International Classification of Diseases
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search conditions, symptoms, or procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              className="flex-1"
            />
            <Button onClick={search} disabled={isLoading || !searchTerm.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div className="grid gap-4">
          {results.map((code, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono text-sm">
                      {code.code}
                    </Badge>
                    <Badge variant="secondary">{code.code_system}</Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {code.display_name}
                  </h3>
                  
                  {code.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {code.description}
                    </p>
                  )}
                  
                  {code.category && (
                    <Badge variant="outline" className="text-xs">
                      📂 {code.category}
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyCode(code.code)}
                  className="flex-shrink-0"
                >
                  {copiedCode === code.code ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}

          {results.length === 0 && !isLoading && searchTerm && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No codes found for "{searchTerm}"</p>
              <p className="text-sm mt-2">Try different search terms</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
