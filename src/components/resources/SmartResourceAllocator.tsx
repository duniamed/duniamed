import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const SmartResourceAllocator = ({ clinicId }: { clinicId: string }) => {
  const [loading, setLoading] = useState(false);
  const [allocation, setAllocation] = useState<any>(null);
  const { toast } = useToast();

  const optimizeAllocation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-resource-allocator', {
        body: {
          clinicId,
          date: new Date().toISOString().split('T')[0],
          appointments: []
        }
      });

      if (error) throw error;
      setAllocation(data.allocation);
      toast({ title: 'Resources optimized successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Smart Resource Allocator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={optimizeAllocation} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Optimize Resource Allocation
        </Button>

        {allocation && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium">Utilization Score</span>
              <span className="text-lg font-bold">{allocation.utilizationScore}%</span>
            </div>

            {allocation.conflicts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Conflicts Detected
                </h4>
                {allocation.conflicts.map((conflict: any, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-destructive/10 rounded">
                    {conflict}
                  </div>
                ))}
              </div>
            )}

            {allocation.recommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Recommendations
                </h4>
                {allocation.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-primary/10 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
