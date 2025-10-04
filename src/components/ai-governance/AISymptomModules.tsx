import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SymptomModule {
  id: string;
  module_key: string;
  storage_ref: string;
  description: string | null;
  version: string;
  status: string;
  owning_team: string | null;
  last_validated_at: string | null;
  created_at: string;
}

export function AISymptomModules() {
  const { data: modules, isLoading } = useQuery({
    queryKey: ['symptomModules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_symptom_checker_modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SymptomModule[];
    }
  });

  if (isLoading) {
    return <div>Loading modules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {modules?.length || 0} registered module(s)
      </div>

      <div className="grid gap-4">
        {modules?.map((module) => (
          <div
            key={module.id}
            className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold font-mono text-sm">{module.module_key}</h3>
                  <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                    {module.status === 'active' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {module.status}
                  </Badge>
                </div>
                {module.description && (
                  <div className="text-sm text-muted-foreground">
                    {module.description}
                  </div>
                )}
              </div>
              <Badge variant="outline">v{module.version}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Storage Reference</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {module.storage_ref}
                </div>
              </div>
              <div>
                <div className="font-medium">Owning Team</div>
                <div className="text-muted-foreground">
                  {module.owning_team || 'Unassigned'}
                </div>
              </div>
            </div>

            {module.last_validated_at && (
              <div className="text-xs text-muted-foreground">
                Last validated: {format(new Date(module.last_validated_at), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        ))}

        {modules?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No symptom checker modules registered yet.
            <div className="text-xs mt-2">
              Modules should be registered via edge functions or migration scripts.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
