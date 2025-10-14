import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const EpicFhirIntegration = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('epic-fhir-sync', {
        body: { patient_id: 'pat_123', sync_direction: 'bidirectional' }
      });

      if (error) throw error;

      toast({
        title: "FHIR Sync Complete",
        description: `Synced ${data.synced_resources?.join(', ')}`
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Epic FHIR Integration</h3>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync Patient Data
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Bidirectional FHIR sync with Epic EHR system
      </p>
    </Card>
  );
};
