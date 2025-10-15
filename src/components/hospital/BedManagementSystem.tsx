import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Bed, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const BedManagementSystem = ({ clinicId }: { clinicId: string }) => {
  const [loading, setLoading] = useState(false);
  const [bedData, setBedData] = useState<any>(null);

  const loadBedStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('realtime-bed-management', {
        body: { clinicId, action: 'status_check' }
      });

      if (error) throw error;
      setBedData(data.bedManagement);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBedStatus();
  }, [clinicId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bed className="h-5 w-5" />
          Bed Management System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={loadBedStatus} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </Button>

        {bedData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-success">
                  {bedData.availableBeds.length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-destructive">
                  {bedData.occupiedBeds.length}
                </div>
                <div className="text-sm text-muted-foreground">Occupied</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {bedData.utilization.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Utilization</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Predicted Discharges (Next 24h)
              </h4>
              <ul className="text-sm space-y-1">
                {bedData.predictedDischarges.map((discharge: any, idx: number) => (
                  <li key={idx} className="text-muted-foreground">
                    • Bed {discharge.bedNumber} - {discharge.estimatedTime}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Allocation Recommendations
              </h4>
              <ul className="text-sm space-y-1">
                {bedData.allocationRecommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Emergency Capacity Reserve</div>
              <div className="text-2xl font-bold">{bedData.emergencyCapacity} beds</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
