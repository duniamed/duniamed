import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wrench, AlertCircle, CheckCircle } from 'lucide-react';

export const EquipmentMaintenanceTracker: React.FC<{ clinicId: string }> = ({ clinicId }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const analyzeEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('equipment-maintenance-ai', {
        body: {
          clinicId,
          equipmentId: null,
          usageData: {},
          maintenanceHistory: []
        }
      });

      if (error) throw error;
      setInsights(data.maintenanceInsights);
      toast({ title: 'Equipment analysis completed' });
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
          <Wrench className="h-5 w-5" />
          Equipment Maintenance AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={analyzeEquipment} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Equipment'}
        </Button>

        {insights && (
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Predicted Failures</CardTitle>
              </CardHeader>
              <CardContent>
                {insights.predictedFailures?.map((failure: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Equipment ID: {failure.equipmentId}</p>
                      <p className="text-sm text-muted-foreground">
                        Probability: {(failure.probability * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Timeframe: {failure.timeframe}
                      </p>
                      <p className="text-sm mt-1">{failure.impact}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.maintenanceSchedule?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{JSON.stringify(item)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
