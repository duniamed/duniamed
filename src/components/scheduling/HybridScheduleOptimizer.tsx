import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Building, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery } from '@tanstack/react-query';

interface HybridScheduleOptimizerProps {
  specialistId: string;
  clinicId: string;
}

export const HybridScheduleOptimizer: React.FC<HybridScheduleOptimizerProps> = ({
  specialistId,
  clinicId
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const { data: optimization, refetch } = useQuery({
    queryKey: ['schedule-optimization', specialistId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hybrid-schedule-optimization', {
        body: {
          specialistId,
          clinicId,
          date: selectedDate,
          preferences: {
            max_consecutive_telehealth: 4,
            preferred_in_person_blocks: 3
          }
        }
      });
      if (error) throw error;
      return data;
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('hybrid-schedule-optimization', {
        body: {
          specialistId,
          clinicId,
          date: selectedDate
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Schedule Optimized",
        description: "Your hybrid schedule has been optimized for efficiency",
      });
      refetch();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hybrid Schedule Optimizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={() => optimizeMutation.mutate()}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Optimize Schedule
          </Button>
        </div>

        {optimization && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {optimization.metrics.total_appointments}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    In-Person
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {optimization.metrics.in_person_count}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Telehealth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {optimization.metrics.telehealth_count}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Schedule Blocks</h3>
              {optimization.schedule_blocks?.map((block: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {block.type === 'in_person_block' ? (
                      <Building className="h-5 w-5 text-primary" />
                    ) : (
                      <Video className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {block.type === 'in_person_block' ? 'In-Person Block' : 'Telehealth Block'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(block.start_time).toLocaleTimeString()} -{' '}
                        {new Date(block.end_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {block.appointments.length} appointments
                  </span>
                </div>
              ))}
            </div>

            {optimization.recommendations && optimization.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Recommendations</h3>
                {optimization.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                    {rec}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <span className="font-semibold">Efficiency Score</span>
              <span className="text-2xl font-bold text-primary">
                {optimization.metrics.efficiency_score}/100
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
