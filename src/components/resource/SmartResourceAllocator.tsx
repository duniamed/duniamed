import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';

interface SmartResourceAllocatorProps {
  clinicId: string;
  date: string;
  resourceType: 'room' | 'equipment' | 'staff';
}

export function SmartResourceAllocator({ clinicId, date, resourceType }: SmartResourceAllocatorProps) {
  const [allocation, setAllocation] = useState<any>(null);
  const { toast } = useToast();

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-resource-allocator', {
        body: { clinicId, date, resourceType }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAllocation(data.allocation);
      toast({
        title: "Resources Optimized",
        description: `${data.allocation.optimization_metrics.conflicts_resolved} conflicts resolved`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Resource Allocator</CardTitle>
        <CardDescription>AI-powered resource optimization for {resourceType}s</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => optimizeMutation.mutate()} 
          disabled={optimizeMutation.isPending}
        >
          {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Resources'}
        </Button>

        {allocation && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Utilization Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allocation.optimization_metrics.utilization_rate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Idle Time Reduced</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allocation.optimization_metrics.idle_time_reduced} min
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Conflicts Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allocation.optimization_metrics.conflicts_resolved}
                  </div>
                </CardContent>
              </Card>
            </div>

            {allocation.allocations && allocation.allocations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Optimized Allocations</h3>
                <div className="space-y-2">
                  {allocation.allocations.map((alloc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Resource {idx + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(alloc.start_time).toLocaleTimeString()} - {new Date(alloc.end_time).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant={alloc.utilization_score > 0.8 ? "default" : "secondary"}>
                        {(alloc.utilization_score * 100).toFixed(0)}% utilized
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allocation.recommendations && allocation.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {allocation.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
